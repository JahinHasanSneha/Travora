-- parameterized queries
-- 1. USERS

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    user_type VARCHAR(20) CHECK (user_type IN ('traveler', 'travel_company', 'supplier', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. TRAVEL COMPANIES

CREATE TABLE IF NOT EXISTS travel_companies (
    company_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE,
    company_name VARCHAR(200) NOT NULL,
    business_registration VARCHAR(100),
    company_address TEXT,
    company_phone VARCHAR(20),
    company_email VARCHAR(255),
    website VARCHAR(255),
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    is_approved BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key
    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- 3. SUPPLIERS

CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE,
    supplier_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(20) CHECK (business_type IN ('hotel', 'restaurant', 'cruise', 'activity')),
    business_registration VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    address TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key
    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- 4. CACHED PLACES (Local Destination & Sight Pool)

CREATE TABLE IF NOT EXISTS cached_places (
    place_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    rating DECIMAL(3,2),
    price_level INTEGER CHECK (price_level BETWEEN 0 AND 4),
    place_type VARCHAR(50) CHECK (place_type IN ('hotel', 'restaurant', 'attraction', 'cruise', 'activity')),
    photo_reference VARCHAR(255),
    image_url TEXT,
    phone_number VARCHAR(50),
    website VARCHAR(255),
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 5. PACKAGES (Pre-made tours)

CREATE TABLE IF NOT EXISTS packages (
    package_id SERIAL PRIMARY KEY,
    company_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    destination_city VARCHAR(100),
    destination_country VARCHAR(100),
    duration_days INTEGER NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    max_group_size INTEGER,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'fully_booked')),
    itinerary TEXT,
    inclusions TEXT[],
    exclusions TEXT[],
    image_url TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    slots_available INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key
    FOREIGN KEY (company_id)
        REFERENCES travel_companies(company_id)
        ON DELETE CASCADE
);


-- Adds the rating column for installs where the packages table already
-- existed before this column was introduced (CREATE TABLE IF NOT EXISTS
-- above is a no-op on an existing table, so this covers that case).
ALTER TABLE packages ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);


-- 6. HOTELS (Linked to suppliers)

CREATE TABLE IF NOT EXISTS hotels (
    hotel_id SERIAL PRIMARY KEY,
    supplier_id INTEGER,
    place_id INTEGER,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
    price_per_night DECIMAL(10,2) NOT NULL,
    amenities TEXT[],
    total_rooms INTEGER DEFAULT 20,
    available_rooms INTEGER DEFAULT 20,
    description TEXT,
    contact_phone VARCHAR(20),
    image_url TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
        ON DELETE CASCADE,

    FOREIGN KEY (place_id)
        REFERENCES cached_places(place_id)
        ON DELETE SET NULL
);


-- 7. RESTAURANTS

CREATE TABLE IF NOT EXISTS restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    supplier_id INTEGER,
    place_id INTEGER,
    name VARCHAR(200) NOT NULL,
    cuisine_type VARCHAR(100),
    address TEXT,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    avg_meal_cost DECIMAL(10,2) NOT NULL,
    rating DECIMAL(3,2),
    opening_time TIME,
    closing_time TIME,
    contact_phone VARCHAR(20),
    image_url TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    has_vegetarian BOOLEAN DEFAULT FALSE,
    has_halal BOOLEAN DEFAULT FALSE,
    total_tables INTEGER DEFAULT 15,
    available_tables INTEGER DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
        ON DELETE CASCADE,

    FOREIGN KEY (place_id)
        REFERENCES cached_places(place_id)
        ON DELETE SET NULL
);


-- 8. CRUISES

CREATE TABLE IF NOT EXISTS cruises (
    cruise_id SERIAL PRIMARY KEY,
    supplier_id INTEGER,
    place_id INTEGER,
    company_name VARCHAR(200) NOT NULL,
    ship_name VARCHAR(200) NOT NULL,
    departure_port VARCHAR(100),
    arrival_port VARCHAR(100),
    route_description TEXT,
    duration_days INTEGER,
    price_per_person DECIMAL(10,2) NOT NULL,
    cabin_types TEXT[],
    max_passengers INTEGER,
    available_tickets INTEGER DEFAULT 100,
    departure_date DATE,
    arrival_date DATE,
    amenities TEXT[],
    image_url TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
        ON DELETE CASCADE,

    FOREIGN KEY (place_id)
        REFERENCES cached_places(place_id)
        ON DELETE SET NULL
);


-- 9. CUSTOM TRIPS

CREATE TABLE IF NOT EXISTS custom_trips (
    trip_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    duration_days INTEGER NOT NULL,
    budget DECIMAL(10,2),
    preferences TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    max_travelers INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'confirmed', 'completed')),
    total_cost_per_person DECIMAL(10,2) DEFAULT 0.00,
    platform_commission DECIMAL(10,2) DEFAULT 0.00,
    itinerary_saved_at TIMESTAMP,  -- NULL = itinerary still editable; set = saved/locked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key
    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- 10. TRIP ITINERARY (Strict Structural Linking)

CREATE TABLE IF NOT EXISTS trip_itinerary (
    itinerary_id SERIAL PRIMARY KEY,
    trip_id INTEGER,
    day_number INTEGER NOT NULL,
    place_id INTEGER,
    hotel_id INTEGER,
    restaurant_id INTEGER,
    cruise_id INTEGER,
    visit_time TIME,
    duration_hours INTEGER,
    notes TEXT,
    cost_per_person DECIMAL(10,2) DEFAULT 0.00,
    custom_name VARCHAR(255),
    custom_type VARCHAR(30),
    estimated_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (trip_id)
        REFERENCES custom_trips(trip_id)
        ON DELETE CASCADE,

    FOREIGN KEY (place_id)
        REFERENCES cached_places(place_id)
        ON DELETE SET NULL,

    FOREIGN KEY (hotel_id)
        REFERENCES hotels(hotel_id)
        ON DELETE SET NULL,

    FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id)
        ON DELETE SET NULL,

    FOREIGN KEY (cruise_id)
        REFERENCES cruises(cruise_id)
        ON DELETE SET NULL
);


-- 11. TRIP MEMBERS (Group Tracking)

CREATE TABLE IF NOT EXISTS trip_members (
    trip_member_id SERIAL PRIMARY KEY,
    trip_id INTEGER,
    user_id INTEGER,
    role VARCHAR(20) CHECK (role IN ('organizer', 'participant')),
    confirmed BOOLEAN DEFAULT FALSE,
    invite_token UUID DEFAULT gen_random_uuid(),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trip_id, user_id),

    -- Foreign Keys
    FOREIGN KEY (trip_id)
        REFERENCES custom_trips(trip_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- 12. BOOKINGS

CREATE TABLE IF NOT EXISTS bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    booking_type VARCHAR(20) CHECK (booking_type IN ('package', 'custom_trip')),
    package_id INTEGER,
    trip_id INTEGER,
    number_of_travelers INTEGER NOT NULL DEFAULT 1,
    total_amount DECIMAL(12,2) NOT NULL,
    platform_commission DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(20) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (package_id)
        REFERENCES packages(package_id)
        ON DELETE SET NULL,

    FOREIGN KEY (trip_id)
        REFERENCES custom_trips(trip_id)
        ON DELETE SET NULL,

    CHECK (
        (booking_type = 'package' AND package_id IS NOT NULL AND trip_id IS NULL) OR
        (booking_type = 'custom_trip' AND trip_id IS NOT NULL AND package_id IS NULL)
    )
);


-- 13. PAYMENT TRANSACTIONS (Simulated Ledger)

CREATE TABLE IF NOT EXISTS payment_transactions (
    transaction_id SERIAL PRIMARY KEY,
    booking_id INTEGER,
    user_id INTEGER,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(20) DEFAULT 'dummy_card',
    card_last4 VARCHAR(4),
    transaction_reference VARCHAR(50) UNIQUE,
    status VARCHAR(20) CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- 14. COMMISSION EARNINGS

CREATE TABLE IF NOT EXISTS commission_earnings (
    commission_id SERIAL PRIMARY KEY,
    booking_id INTEGER,
    admin_commission DECIMAL(10,2) NOT NULL,
    supplier_payout DECIMAL(12,2) NOT NULL,
    platform_revenue DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key
    FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE
);


-- 15. REVIEWS (Strict Relational Constraints)

CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    package_id INTEGER,
    hotel_id INTEGER,
    restaurant_id INTEGER,
    cruise_id INTEGER,
    trip_id INTEGER,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (package_id)
        REFERENCES packages(package_id)
        ON DELETE CASCADE,

    FOREIGN KEY (hotel_id)
        REFERENCES hotels(hotel_id)
        ON DELETE CASCADE,

    FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id)
        ON DELETE CASCADE,

    FOREIGN KEY (cruise_id)
        REFERENCES cruises(cruise_id)
        ON DELETE CASCADE,

    FOREIGN KEY (trip_id)
        REFERENCES custom_trips(trip_id)
        ON DELETE CASCADE,

    CONSTRAINT reviews_one_target_check CHECK (
        (package_id IS NOT NULL)::INT +
        (hotel_id IS NOT NULL)::INT +
        (restaurant_id IS NOT NULL)::INT +
        (cruise_id IS NOT NULL)::INT +
        (trip_id IS NOT NULL)::INT = 1
    )
);

-- Trip reviews: upgrades installs where `reviews` / `custom_trips` already exist
-- (CREATE TABLE IF NOT EXISTS above will not alter an existing table).
-- Safe to re-run: every statement is idempotent.
ALTER TABLE custom_trips ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS trip_id INTEGER;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_trip_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_trip_id_fkey
    FOREIGN KEY (trip_id) REFERENCES custom_trips(trip_id) ON DELETE CASCADE;

-- Old 4-way check (auto-named `reviews_check`) -> new 5-way check including trip_id
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_one_target_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_one_target_check CHECK (
    (package_id IS NOT NULL)::INT +
    (hotel_id IS NOT NULL)::INT +
    (restaurant_id IS NOT NULL)::INT +
    (cruise_id IS NOT NULL)::INT +
    (trip_id IS NOT NULL)::INT = 1
);

CREATE INDEX IF NOT EXISTS idx_reviews_package ON reviews(package_id);
CREATE INDEX IF NOT EXISTS idx_reviews_hotel ON reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_cruise ON reviews(cruise_id);
CREATE INDEX IF NOT EXISTS idx_reviews_trip ON reviews(trip_id);


-- 16. REVOKED TOKENS (JWT logout blacklist)
-- Referenced by src/middleware/auth.js and src/controllers/auth.controller.js (logout)
-- so a logged-out token can never be reused before it naturally expires.

CREATE TABLE IF NOT EXISTS revoked_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);


-- INDEXES FOR PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_packages_city ON packages(destination_city);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_coords ON hotels(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_coords ON restaurants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_cruises_port ON cruises(departure_port);
CREATE INDEX IF NOT EXISTS idx_trips_user ON custom_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON custom_trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_transactions_booking ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_cached_places_city ON cached_places(city);
CREATE INDEX IF NOT EXISTS idx_cached_places_coords ON cached_places(latitude, longitude);


-- TRIGGER: auto-update `updated_at` columns

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users',
        'packages',
        'hotels',
        'restaurants',
        'cruises',
        'custom_trips',
        'bookings',
        'payment_transactions',
        'reviews'
    ]
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I',
            t, t
        );

        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW
             EXECUTE FUNCTION set_updated_at()',
            t, t
        );
    END LOOP;
END $$;


-- TRIGGER: auto-update listing rating on new/updated review
-- TRIGGER = WHEN to execute
-- TRIGGER FUNCTION = WHAT to execute
CREATE OR REPLACE FUNCTION refresh_listing_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hotel_id IS NOT NULL THEN
        UPDATE hotels
        SET rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews
            WHERE hotel_id = NEW.hotel_id
        )
        WHERE hotel_id = NEW.hotel_id;

    ELSIF NEW.restaurant_id IS NOT NULL THEN
        UPDATE restaurants
        SET rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews
            WHERE restaurant_id = NEW.restaurant_id
        )
        WHERE restaurant_id = NEW.restaurant_id;

    ELSIF NEW.cruise_id IS NOT NULL THEN
        UPDATE cruises
        SET rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews
            WHERE cruise_id = NEW.cruise_id
        )
        WHERE cruise_id = NEW.cruise_id;

    ELSIF NEW.package_id IS NOT NULL THEN
        UPDATE packages
        SET rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews
            WHERE package_id = NEW.package_id
        )
        WHERE package_id = NEW.package_id;

    ELSIF NEW.trip_id IS NOT NULL THEN
        UPDATE custom_trips
        SET rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews
            WHERE trip_id = NEW.trip_id
        )
        WHERE trip_id = NEW.trip_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_rating ON reviews;

CREATE TRIGGER trg_reviews_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION refresh_listing_rating();


-- FUNCTION: compute a custom trip's total cost per person
-- Statistical/computed value derived from the database, used by
-- src/controllers/tripItinerary.controller.js and
-- src/controllers/itineraryGenerator.controller.js instead of an
-- ad-hoc SUM query, so the calculation lives in one place.

CREATE OR REPLACE FUNCTION calculate_trip_total_cost(p_trip_id INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(cost_per_person), 0)
    INTO v_total
    FROM trip_itinerary
    WHERE trip_id = p_trip_id;

    RETURN v_total;
END;
$$;


-- PROCEDURE: record a successful payment
-- Multi-step workflow that modifies three tables in one call:
--   1. inserts the ledger entry in payment_transactions
--   2. marks the booking as paid/confirmed
--   3. splits and records the commission in commission_earnings
-- Used by src/controllers/payments.controller.js (checkout), which
-- still wraps the CALL in its own BEGIN/COMMIT/ROLLBACK so the whole
-- checkout (card validation + ledger write + booking update +
-- commission split) stays one atomic transaction.

CREATE OR REPLACE PROCEDURE process_successful_payment(
    p_booking_id INTEGER,
    p_user_id INTEGER,
    p_amount DECIMAL(12,2),
    p_card_last4 VARCHAR(4),
    p_transaction_reference VARCHAR(50),
    p_commission_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_platform_commission DECIMAL(10,2);
    v_supplier_payout DECIMAL(12,2);
BEGIN
    -- Step 1: write the ledger entry
    INSERT INTO payment_transactions (
        booking_id, user_id, amount, currency, payment_method,
        card_last4, transaction_reference, status
    ) VALUES (
        p_booking_id, p_user_id, p_amount, 'USD', 'dummy_card',
        p_card_last4, p_transaction_reference, 'success'
    );

    -- Step 2: mark the booking paid + confirmed, capturing its commission
    UPDATE bookings
    SET payment_status = 'paid', booking_status = 'confirmed'
    WHERE booking_id = p_booking_id
    RETURNING platform_commission INTO v_platform_commission;

    -- Step 3: split and record the commission / supplier payout
    v_supplier_payout := ROUND(p_amount - v_platform_commission, 2);

    INSERT INTO commission_earnings (
        booking_id, admin_commission, supplier_payout, platform_revenue, commission_rate
    ) VALUES (
        p_booking_id, v_platform_commission, v_supplier_payout, v_platform_commission, p_commission_rate
    );
END;
$$;


-- =====================================================================
-- TRIP FLOW: save itinerary -> organizer books -> public / invite
-- (same content as migrations/001_trip_flow_saved_itinerary_calculated_budget.sql;
--  idempotent, so it is safe on both fresh installs and existing databases)
-- =====================================================================
-- ---------------------------------------------------------------------
-- 1. New columns
-- ---------------------------------------------------------------------

-- NULL  = itinerary still being built (editable by the organizer)
-- value = organizer clicked "Save Itinerary"; itinerary + cost are frozen
ALTER TABLE custom_trips
    ADD COLUMN IF NOT EXISTS itinerary_saved_at TIMESTAMP;

-- The API already writes these three columns for "custom plans", but they
-- were never part of schema.sql. IF NOT EXISTS makes this a no-op if you
-- already added them by hand on Neon.
ALTER TABLE trip_itinerary
    ADD COLUMN IF NOT EXISTS custom_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS custom_type VARCHAR(30),
    ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);

-- ---------------------------------------------------------------------
-- 2. Backfill existing rows (before the guard triggers exist)
-- ---------------------------------------------------------------------

-- Trips that were already booked/completed are, by definition, already
-- locked: treat their itinerary as saved so the new rules apply to them.
UPDATE custom_trips
   SET itinerary_saved_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
 WHERE itinerary_saved_at IS NULL
   AND status IN ('confirmed', 'completed');

-- Trips still being planned: make sure the stored per-person cost matches
-- the itinerary items (single source of truth = calculate_trip_total_cost).
UPDATE custom_trips t
   SET total_cost_per_person = calculate_trip_total_cost(t.trip_id)
 WHERE t.itinerary_saved_at IS NULL
   AND t.total_cost_per_person IS DISTINCT FROM calculate_trip_total_cost(t.trip_id);

-- ---------------------------------------------------------------------
-- 3. Guard: saved itinerary / calculated cost cannot change (any client)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION guard_trip_itinerary_items()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_trip  INTEGER;
    v_saved TIMESTAMP;
BEGIN
    IF TG_OP = 'DELETE' THEN v_trip := OLD.trip_id; ELSE v_trip := NEW.trip_id; END IF;

    SELECT itinerary_saved_at INTO v_saved FROM custom_trips WHERE trip_id = v_trip;

    -- Parent trip gone (ON DELETE CASCADE in progress) or no trip: allow.
    IF NOT FOUND OR v_saved IS NULL THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
        RETURN NEW;
    END IF;

    -- Saved trip: only "housekeeping" updates are allowed, e.g. the
    -- ON DELETE SET NULL that fires when a hotel/restaurant is removed.
    IF TG_OP = 'UPDATE' THEN
        IF NEW.trip_id         IS DISTINCT FROM OLD.trip_id
        OR NEW.day_number      IS DISTINCT FROM OLD.day_number
        OR NEW.cost_per_person IS DISTINCT FROM OLD.cost_per_person
        OR NEW.custom_name     IS DISTINCT FROM OLD.custom_name
        OR NEW.custom_type     IS DISTINCT FROM OLD.custom_type
        OR NEW.estimated_cost  IS DISTINCT FROM OLD.estimated_cost THEN
            RAISE EXCEPTION 'This itinerary has been saved and can no longer be modified.';
        END IF;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'This itinerary has been saved and can no longer be modified.';
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_trip_itinerary_items ON trip_itinerary;
CREATE TRIGGER trg_guard_trip_itinerary_items
BEFORE INSERT OR UPDATE OR DELETE ON trip_itinerary
FOR EACH ROW EXECUTE FUNCTION guard_trip_itinerary_items();

-- ---------------------------------------------------------------------
-- 4. Guard: custom_trips
--    a) once saved, cost / days / destination / saved flag are frozen
--    b) a trip can only be made public after the organizer booked it
-- ---------------------------------------------------------------------
-- Make trip public
--       ↓
-- Was it private before?
--       ↓ YES
-- Is trip confirmed/completed?
--     ↙            ↘
--   YES             NO
--    ↓               ↓
-- ALLOW             BLOCK
CREATE OR REPLACE FUNCTION guard_custom_trips()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_was_public BOOLEAN := FALSE;
BEGIN
    -- OLD only exists for UPDATE, so it is only touched inside this branch.
    IF TG_OP = 'UPDATE' THEN
        v_was_public := COALESCE(OLD.is_public, FALSE);

        IF OLD.itinerary_saved_at IS NOT NULL THEN
            IF NEW.itinerary_saved_at    IS DISTINCT FROM OLD.itinerary_saved_at
            OR NEW.total_cost_per_person IS DISTINCT FROM OLD.total_cost_per_person
            OR NEW.platform_commission   IS DISTINCT FROM OLD.platform_commission
            OR NEW.duration_days         IS DISTINCT FROM OLD.duration_days
            OR NEW.destination_city      IS DISTINCT FROM OLD.destination_city
            OR NEW.destination_country   IS DISTINCT FROM OLD.destination_country THEN
                RAISE EXCEPTION 'This itinerary has been saved; its plan and calculated cost can no longer be modified.';
            END IF;
        END IF;
    END IF;

    -- Only checked when a trip BECOMES public, so old rows are never blocked
    -- from unrelated updates (e.g. rating refresh).
    IF COALESCE(NEW.is_public, FALSE) AND NOT v_was_public
       AND NEW.status NOT IN ('confirmed', 'completed') THEN
        RAISE EXCEPTION 'A trip can only be made public after the organizer has booked it.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_custom_trips ON custom_trips;
CREATE TRIGGER trg_guard_custom_trips
BEFORE INSERT OR UPDATE ON custom_trips
FOR EACH ROW EXECUTE FUNCTION guard_custom_trips();

-- ---------------------------------------------------------------------
-- 5. Guard: travelers can only be added (invited / joined) to a booked trip
--    (only new participant rows are checked; existing members untouched)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION guard_trip_members_join()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_status VARCHAR(20);
BEGIN
    IF NEW.role = 'participant' THEN
        SELECT status INTO v_status FROM custom_trips WHERE trip_id = NEW.trip_id;
        IF FOUND AND v_status <> 'confirmed' THEN
            RAISE EXCEPTION 'The organizer must book this trip before travelers can be invited or join.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_trip_members_join ON trip_members;
CREATE TRIGGER trg_guard_trip_members_join
BEFORE INSERT ON trip_members
FOR EACH ROW EXECUTE FUNCTION guard_trip_members_join();

-- ---------------------------------------------------------------------
-- 6. Guard: booking order for custom trips
--    itinerary must be saved; travelers can only book after the organizer
-- ---------------------------------------------------------------------
-- Participant tries booking
--           ↓
-- Is user organizer?
--       ↙         ↘
--     YES          NO
--      ↓            ↓
--   allowed      Is trip already
--                confirmed/completed?
--                    ↙       ↘
--                  YES       NO
--                   ↓         ↓
--                 ALLOW      BLOCK
CREATE OR REPLACE FUNCTION guard_custom_trip_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_saved  TIMESTAMP;
    v_status VARCHAR(20);
BEGIN
    IF NEW.booking_type = 'custom_trip' AND NEW.trip_id IS NOT NULL THEN
        SELECT itinerary_saved_at, status INTO v_saved, v_status
          FROM custom_trips WHERE trip_id = NEW.trip_id;

        IF FOUND THEN
            IF v_saved IS NULL THEN
                RAISE EXCEPTION 'Save the itinerary before booking this trip.';
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM trip_members
                 WHERE trip_id = NEW.trip_id AND user_id = NEW.user_id AND role = 'organizer'
            ) AND v_status NOT IN ('confirmed', 'completed') THEN
                RAISE EXCEPTION 'The organizer must book this trip first.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_custom_trip_booking ON bookings;
CREATE TRIGGER trg_guard_custom_trip_booking
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION guard_custom_trip_booking();


-- =====================================================================
-- SLOT RULE: only CONFIRMED bookings occupy a slot
-- Re-derives packages.slots_available / fully_booked from confirmed
-- bookings (older versions reserved slots as soon as a booking was
-- created, i.e. while it was still pending). Idempotent: the result only
-- depends on max_group_size and the confirmed bookings.
-- =====================================================================
UPDATE packages p
   SET slots_available = GREATEST(p.max_group_size - c.n, 0),
       status = CASE
                  WHEN p.status = 'inactive' THEN 'inactive'
                  WHEN p.max_group_size - c.n <= 0 THEN 'fully_booked'
                  ELSE 'active'
                END
  FROM (
    SELECT pk.package_id,
           COALESCE(SUM(GREATEST(b.number_of_travelers, 1)) FILTER (WHERE b.booking_status IN ('confirmed', 'completed')), 0) AS n
      FROM packages pk
      LEFT JOIN bookings b ON b.package_id = pk.package_id
     GROUP BY pk.package_id
  ) c
 WHERE p.package_id = c.package_id
   AND p.max_group_size IS NOT NULL;
-- confirmed
-- → booked/active
-- → participants may book

-- completed
-- → trip has finished
-- → nobody can newly book it

-- 5 triggers 1 function 1 procedure


-- | Relationship                              | Type         |
-- | ----------------------------------------- | ------------ |
-- | User → Travel Company                     | **1 : 0..1** |
-- | User → Supplier                           | **1 : 0..1** |
-- | Travel Company → Packages                 | **1 : N**    |
-- | Supplier → Hotels                         | **1 : N**    |
-- | Supplier → Restaurants                    | **1 : N**    |
-- | Supplier → Cruises                        | **1 : N**    |
-- | User → Custom Trips                       | **1 : N**    |
-- | Custom Trip → Trip Itinerary              | **1 : N**    |
-- | User → Bookings                           | **1 : N**    |
-- | Package → Bookings                        | **1 : N**    |
-- | Custom Trip → Bookings                    | **1 : N**    |
-- | User ↔ Custom Trip through `trip_members` | **M : N**    |

-- | Relationship | What you normally do                                                      |
-- | ------------ | ------------------------------------------------------------------------- |
-- | **1 : 1**    | Put a **foreign key + UNIQUE** in one table                               |
-- | **1 : N**    | Put the **foreign key on the N (many) side**                              |
-- | **M : N**    | Create a **new junction/relationship table** containing both foreign keys |
