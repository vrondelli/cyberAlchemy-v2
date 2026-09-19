export const ACTIVE_COMPLETE = Object.freeze({
  fixture_id: "active-complete",
  is_active: true,
  first_pending_step: "11",
});

export const ACTIVE_PENDING_3 = Object.freeze({
  fixture_id: "active-pending-3",
  is_active: true,
  first_pending_step: "3",
});

export const INACTIVE = Object.freeze({
  fixture_id: "inactive",
  is_active: false,
  first_pending_step: "login",
});

export const SESSION_FIXTURES = Object.freeze({
  [ACTIVE_COMPLETE.fixture_id]: ACTIVE_COMPLETE,
  [ACTIVE_PENDING_3.fixture_id]: ACTIVE_PENDING_3,
  [INACTIVE.fixture_id]: INACTIVE,
});
