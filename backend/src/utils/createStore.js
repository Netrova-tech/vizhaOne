function createStore() {
  const state = {
    users: [],
    categories: [],
    services: [],
    halls: [],
    packages: [],
    bookings: [],
    inquiries: [],
    signups: [],
    hall_services: [],
    otpRequests: new Map(),
  };

  return {
    get(table) {
      return state[table];
    },
    push(table, value) {
      state[table].push(value);
      return value;
    },
    set(table, value) {
      state[table] = value;
      return value;
    },
    otpRequests: state.otpRequests,
  };
}

module.exports = {
  createStore,
};
