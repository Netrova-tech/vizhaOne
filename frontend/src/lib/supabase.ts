type QueryResult<T = unknown> = Promise<{ data: T; error: null }>;

type Session = {
  user: {
    id: string;
  };
} | null;

class QueryBuilder<T = unknown> {
  private readonly result: T;

  constructor(result: T) {
    this.result = result;
  }

  select(..._args: any[]) {
    return this;
  }

  order(..._args: any[]) {
    return this;
  }

  eq(..._args: any[]) {
    return this;
  }

  single(..._args: any[]) {
    return Promise.resolve({ data: null, error: null });
  }

  insert(..._args: any[]) {
    return this;
  }

  update(..._args: any[]) {
    return this;
  }

  upsert(..._args: any[]) {
    return Promise.resolve({ data: null, error: null });
  }

  delete(..._args: any[]) {
    return this;
  }

  then<TResult1 = { data: T; error: null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: T; error: null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve({ data: this.result, error: null }).then(onfulfilled, onrejected);
  }
}

export const isSupabaseConfigured = false;

export const supabase = {
  from<T = unknown>(_table: string) {
    return new QueryBuilder<T[]>([]);
  },
  auth: {
    async getSession(): QueryResult<{ session: Session }> {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange(
      callback: (_event: string, session: Session) => void
    ): { data: { subscription: { unsubscribe: () => void } } } {
      callback("SIGNED_OUT", null);
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
    async signOut(): QueryResult<null> {
      return { data: null, error: null };
    },
    async verifyOtp(_params?: { phone?: string; token?: string; type?: string }): QueryResult<{ user: { id: string } | null }> {
      return { data: { user: null }, error: null };
    },
    async signInWithOtp(_params?: { phone?: string }): QueryResult<null> {
      return { data: null, error: null };
    },
  },
  storage: {
    from(_bucket: string) {
      return {
        async upload(_path: string, _file: File, _options?: { upsert?: boolean }) {
          return { data: null, error: new Error("Storage upload is disabled in demo mode") };
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: path } };
        },
      };
    },
  },
};

export type { Session };
