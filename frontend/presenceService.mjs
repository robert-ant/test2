const memory = { rows: new Map(), logs: [] };

const repo = {
  async find(userId) {
    return memory.rows.get(userId) || null;
  },
  async updateWhereVersion(userId, expectedVersion, data) {
    const current = memory.rows.get(userId) || {
      userId,
      status: 'offline',
      actorType: 'user',
      actorId: null,
      version: 0,
      updatedAt: new Date(0).toISOString(),
    };
    if (current.version !== expectedVersion) return null;
    const next = { ...current, ...data };
    memory.rows.set(userId, next);
    return next;
  },
  async appendLog(row) {
    memory.logs.push({
      id: memory.logs.length + 1,
      userId: row.userId,
      toStatus: row.status,
      actorType: row.actorType,
      actorId: row.actorId,
      at: row.updatedAt,
    });
  },
};

export const presenceService = {
  /**
   * @param {{userId:string,nextStatus:'online'|'offline',actorType:'user'|'admin',actorId?:string|null,reason?:string|null}} args
   */
  async setPresence({ userId, nextStatus, actorType, actorId = null }) {
    const current = await repo.find(userId);
    const fromVersion = current?.version ?? 0;
    const nextVersion = fromVersion + 1;

    const updated = await repo.updateWhereVersion(userId, fromVersion, {
      userId,
      status: nextStatus,
      actorType,
      actorId,
      version: nextVersion,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      const latest = await repo.find(userId);
      const err = new Error('VERSION_CONFLICT');
      err.latest = latest; // attach for UI reconciliation
      throw err;
    }

    await repo.appendLog(updated);
    return updated;
  },
};