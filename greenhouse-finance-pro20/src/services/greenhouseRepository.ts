import { getDatabase } from '../db/indexedDB.js';
import { Greenhouse, GreenhouseTunnel } from '../types/index.js';

// ============================================================================
// GREENHOUSE REPOSITORY
// ============================================================================
export const greenhouseRepository = {
  async getAll(): Promise<Greenhouse[]> {
    const db = await getDatabase();
    const list = await db.getAll('greenhouses');
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getById(id: string): Promise<Greenhouse | undefined> {
    const db = await getDatabase();
    return db.get('greenhouses', id);
  },

  async create(data: Omit<Greenhouse, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Greenhouse> {
    const db = await getDatabase();
    const all = await db.getAll('greenhouses');
    
    // Collision-proof ID generation
    let newId = data.id;
    if (!newId) {
      let maxNum = 0;
      for (const g of all) {
        const match = g.id.match(/^GH-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      newId = `GH-${String(maxNum + 1).padStart(3, '0')}`;
      if (all.some(g => g.id === newId)) {
        newId = `GH-${String(maxNum + 1).padStart(3, '0')}-${Date.now().toString(36).slice(-4)}`;
      }
    }

    const now = new Date().toISOString();

    const lengthM = Number(data.lengthM) || 0;
    const widthM = Number(data.widthM) || 0;
    const areaM2 = lengthM * widthM;

    const greenhouse: Greenhouse = {
      ...data,
      id: newId,
      code: data.code || newId,
      lengthM,
      widthM,
      areaM2,
      createdAt: now,
      updatedAt: now
    };

    await db.put('greenhouses', greenhouse);
    return greenhouse;
  },

  async update(id: string, updates: Partial<Greenhouse>): Promise<Greenhouse> {
    const db = await getDatabase();
    const current = await db.get('greenhouses', id);
    if (!current) throw new Error('Data greenhouse tidak ditemukan');

    const lengthM = updates.lengthM !== undefined ? Number(updates.lengthM) : current.lengthM;
    const widthM = updates.widthM !== undefined ? Number(updates.widthM) : current.widthM;
    const areaM2 = (lengthM || 0) * (widthM || 0);

    const updated: Greenhouse = {
      ...current,
      ...updates,
      lengthM,
      widthM,
      areaM2,
      updatedAt: new Date().toISOString()
    };

    await db.put('greenhouses', updated);
    return updated;
  },

  async checkRelatedData(id: string): Promise<{ tunnelCount: number; cycleCount: number; investmentCount: number }> {
    const db = await getDatabase();
    const tunnels = await db.getAllFromIndex('greenhouseTunnels', 'by-greenhouse', id);
    const allCycles = await db.getAll('cycles');
    const cycles = allCycles.filter(c => c.greenhouseId === id);
    const allInvestments = await db.getAll('investments');
    const investments = allInvestments.filter(i => i.greenhouseId === id);

    return {
      tunnelCount: tunnels.length,
      cycleCount: cycles.length,
      investmentCount: investments.length
    };
  },

  async delete(id: string, force: boolean = false): Promise<void> {
    const db = await getDatabase();
    const related = await this.checkRelatedData(id);

    if (!force && (related.tunnelCount > 0 || related.cycleCount > 0 || related.investmentCount > 0)) {
      throw new Error(
        `Greenhouse masih memiliki data terkait (${related.tunnelCount} tunnel, ${related.cycleCount} siklus, ${related.investmentCount} investasi). Hapus atau pindahkan data terkait terlebih dahulu, atau ubah status menjadi Nonaktif.`
      );
    }

    // If force delete or no related cycles/investments, remove tunnels first
    const tunnels = await db.getAllFromIndex('greenhouseTunnels', 'by-greenhouse', id);
    for (const tnl of tunnels) {
      await db.delete('greenhouseTunnels', tnl.id);
    }

    await db.delete('greenhouses', id);
  }
};

// ============================================================================
// GREENHOUSE TUNNEL REPOSITORY
// ============================================================================
export const greenhouseTunnelRepository = {
  async getAll(): Promise<GreenhouseTunnel[]> {
    const db = await getDatabase();
    return db.getAll('greenhouseTunnels');
  },

  async getByGreenhouseId(greenhouseId: string): Promise<GreenhouseTunnel[]> {
    const db = await getDatabase();
    const list = await db.getAllFromIndex('greenhouseTunnels', 'by-greenhouse', greenhouseId);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(id: string): Promise<GreenhouseTunnel | undefined> {
    const db = await getDatabase();
    return db.get('greenhouseTunnels', id);
  },

  async create(data: Omit<GreenhouseTunnel, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<GreenhouseTunnel> {
    const db = await getDatabase();
    const all = await db.getAll('greenhouseTunnels');
    
    // Collision-proof ID generation
    let newId = data.id;
    if (!newId) {
      let maxNum = 0;
      for (const t of all) {
        const match = t.id.match(/^TNL-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      newId = `TNL-${String(maxNum + 1).padStart(3, '0')}`;
      if (all.some(t => t.id === newId)) {
        newId = `TNL-${String(maxNum + 1).padStart(3, '0')}-${Date.now().toString(36).slice(-4)}`;
      }
    }

    const now = new Date().toISOString();

    const lengthM = Number(data.lengthM) || 0;
    const widthM = Number(data.widthM) || 0;
    const areaM2 = lengthM * widthM;

    const gutterCount = Number(data.gutterCount) || 0;
    const holesPerGutter = Number(data.holesPerGutter) || 0;
    
    // Perhitungan totalPlantHoles dan pemisahan plantCapacity (Requirement H)
    const calcHoles = gutterCount * holesPerGutter;
    const totalPlantHoles = calcHoles > 0 
      ? calcHoles 
      : (data.totalPlantHoles !== undefined && data.totalPlantHoles > 0 ? data.totalPlantHoles : (data.plantCapacity || 0));

    const plantCapacity = data.plantCapacity !== undefined && data.plantCapacity >= 0
      ? data.plantCapacity
      : totalPlantHoles;

    const tunnel: GreenhouseTunnel = {
      ...data,
      id: newId,
      code: data.code || newId,
      lengthM,
      widthM,
      areaM2,
      gutterCount,
      holesPerGutter,
      totalPlantHoles,
      plantCapacity,
      createdAt: now,
      updatedAt: now
    };

    await db.put('greenhouseTunnels', tunnel);

    // Sync greenhouse tunnelCount and totalPlantCapacity
    await this.syncGreenhouseCapacity(data.greenhouseId);

    return tunnel;
  },

  async update(id: string, updates: Partial<GreenhouseTunnel>): Promise<GreenhouseTunnel> {
    const db = await getDatabase();
    const current = await db.get('greenhouseTunnels', id);
    if (!current) throw new Error('Data tunnel tidak ditemukan');

    const lengthM = updates.lengthM !== undefined ? Number(updates.lengthM) : current.lengthM;
    const widthM = updates.widthM !== undefined ? Number(updates.widthM) : current.widthM;
    const areaM2 = (lengthM || 0) * (widthM || 0);

    const gutterCount = updates.gutterCount !== undefined ? Number(updates.gutterCount) : current.gutterCount;
    const holesPerGutter = updates.holesPerGutter !== undefined ? Number(updates.holesPerGutter) : current.holesPerGutter;
    const calcHoles = (gutterCount || 0) * (holesPerGutter || 0);
    
    // Pertahankan pemisahan totalPlantHoles dan plantCapacity (Requirement H)
    const totalPlantHoles = calcHoles > 0 
      ? calcHoles 
      : (updates.totalPlantHoles !== undefined ? updates.totalPlantHoles : (current.totalPlantHoles || 0));

    const plantCapacity = updates.plantCapacity !== undefined 
      ? updates.plantCapacity 
      : current.plantCapacity;

    const updated: GreenhouseTunnel = {
      ...current,
      ...updates,
      lengthM,
      widthM,
      areaM2,
      gutterCount,
      holesPerGutter,
      totalPlantHoles,
      plantCapacity,
      updatedAt: new Date().toISOString()
    };

    await db.put('greenhouseTunnels', updated);

    // Sync greenhouse
    await this.syncGreenhouseCapacity(updated.greenhouseId);

    return updated;
  },

  async checkRelatedData(id: string): Promise<{ cycleCount: number; relatedCycles: string[] }> {
    const db = await getDatabase();
    const tunnel = await db.get('greenhouseTunnels', id);
    if (!tunnel) return { cycleCount: 0, relatedCycles: [] };
    const allCycles = await db.getAll('cycles');
    const matching = allCycles.filter(c => c.tunnelId === id || c.tunnel === tunnel.name);
    return {
      cycleCount: matching.length,
      relatedCycles: matching.map(c => c.namaSiklus || c.id)
    };
  },

  async delete(id: string, force: boolean = false): Promise<void> {
    const db = await getDatabase();
    const current = await db.get('greenhouseTunnels', id);
    if (!current) return;

    const related = await this.checkRelatedData(id);
    if (!force && related.cycleCount > 0) {
      throw new Error(
        `Tunnel ini masih digunakan oleh data siklus produksi (${related.cycleCount} siklus: ${related.relatedCycles.join(', ')}). Tidak dapat dihapus langsung.`
      );
    }

    await db.delete('greenhouseTunnels', id);
    await this.syncGreenhouseCapacity(current.greenhouseId);
  },

  // Sinkronisasi tunnelCount & totalPlantCapacity (Requirement P)
  async syncGreenhouseCapacity(greenhouseId: string): Promise<void> {
    const db = await getDatabase();
    const gh = await db.get('greenhouses', greenhouseId);
    if (!gh) return;

    const tunnels = await db.getAllFromIndex('greenhouseTunnels', 'by-greenhouse', greenhouseId);
    const activeTunnels = tunnels.filter(t => t.status !== 'inactive');

    // Jika greenhouse memiliki tunnel, gunakan sum(tunnel.plantCapacity)
    // Jika belum memiliki tunnel, jangan merusak nilai manual greenhouse
    let totalCap = gh.totalPlantCapacity || 0;
    if (tunnels.length > 0) {
      totalCap = activeTunnels.reduce((sum, t) => sum + (t.plantCapacity !== undefined ? t.plantCapacity : (t.totalPlantHoles || 0)), 0);
    }

    await db.put('greenhouses', {
      ...gh,
      tunnelCount: tunnels.length,
      totalPlantCapacity: totalCap,
      updatedAt: new Date().toISOString()
    });
  }
};
