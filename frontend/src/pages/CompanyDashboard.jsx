import { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { getBookingImage } from '../utils/bookingImage';

const CONFIRMED_STATES = ['confirmed', 'completed'];
const occupiesSlot = (t) =>
  typeof t.occupies_slot === 'boolean'
    ? t.occupies_slot
    : CONFIRMED_STATES.includes(t.status);

const initialForm = {
  title: '',
  destination_city: '',
  destination_country: '',
  duration_days: 3,
  base_price: 500,
  max_group_size: 10,
  image_url: '',
  start_date: '',
  end_date: '',
  description: '',
};

export default function CompanyDashboard() {
  const [packages, setPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [brokenImages, setBrokenImages] = useState({});

  // Traveler modal
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [travelers, setTravelers] = useState([]);
  const [loadingTravelers, setLoadingTravelers] = useState(false);
  const [travelerSearch, setTravelerSearch] = useState('');

  // ---------------------------------------------------------
  // LOAD PACKAGES
  // ---------------------------------------------------------

  const load = async () => {
    const { data } = await client.get('/packages/mine/list');
    setPackages(data);
  };

  useEffect(() => {
    load();
  }, []);

  // ---------------------------------------------------------
  // FORM
  // ---------------------------------------------------------

  const update = (key) => (e) => {
    setForm((current) => ({
      ...current,
      [key]: e.target.value,
    }));
  };

  const clearImage = () => {
    setImageError('');
    setForm((current) => ({ ...current, image_url: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await client.post('/packages', {
        ...form,
        image_url: form.image_url || null,
        duration_days: Number(form.duration_days),
        base_price: Number(form.base_price),
        max_group_size: Number(form.max_group_size),
      });

      setForm(initialForm);
      setImageError('');
      setShowForm(false);

      await load();
    } catch (error) {
      console.error('Failed to create package:', error);
      alert(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Failed to create package.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // ACTIVATE / DEACTIVATE
  // ---------------------------------------------------------

  const toggleStatus = async (pkg) => {
    try {
      await client.patch(`/packages/${pkg.package_id}`, {
        status:
          pkg.status === 'inactive'
            ? 'active'
            : 'inactive',
      });

      await load();
    } catch (error) {
      console.error('Failed to update package:', error);
    }
  };

  // ---------------------------------------------------------
  // OPEN TRAVELER LIST
  // ---------------------------------------------------------

  const viewTravelers = async (pkg) => {
    setSelectedPackage(pkg);
    setTravelerSearch('');
    setTravelers([]);
    setLoadingTravelers(true);

    try {
      /*
       * Expected backend endpoint:
       *
       * GET /packages/:package_id/enrollments
       *
       * Example response:
       *
       * [
       *   {
       *     booking_id: 1,
       *     name: "John Doe",
       *     email: "john@example.com",
       *     mobile: "017...",
       *     level_term: "L2-T1",
       *     members: 2,
       *     status: "confirmed",
       *     created_at: "2026-09-15"
       *   }
       * ]
       */

      const { data } = await client.get(
        `/packages/${pkg.package_id}/enrollments`
      );

      setTravelers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        'Failed to load enrolled travelers:',
        error
      );

      setTravelers([]);
    } finally {
      setLoadingTravelers(false);
    }
  };

  const closeTravelers = () => {
    setSelectedPackage(null);
    setTravelers([]);
    setTravelerSearch('');
  };

  // ---------------------------------------------------------
  // FILTER TRAVELERS
  // ---------------------------------------------------------

  const filteredTravelers = useMemo(() => {
    const query = travelerSearch
      .trim()
      .toLowerCase();

    if (!query) return travelers;

    return travelers.filter((traveler) => {
      return (
        String(traveler.name || '')
          .toLowerCase()
          .includes(query) ||
        String(traveler.email || '')
          .toLowerCase()
          .includes(query) ||
        String(traveler.mobile || '')
          .toLowerCase()
          .includes(query) ||
        String(traveler.level_term || '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [travelers, travelerSearch]);

  // Only confirmed bookings occupy slots; the rest are shown separately.
  const confirmedTravelers = filteredTravelers.filter(occupiesSlot);
  const pendingTravelers = filteredTravelers.filter(
    (t) => !occupiesSlot(t) && t.status !== 'cancelled'
  );
  const confirmedSeats = travelers
    .filter(occupiesSlot)
    .reduce((sum, t) => sum + Number(t.members || 1), 0);
  const selectedCapacity = selectedPackage
    ? Number(selectedPackage.max_group_size || 0)
    : 0;

  // ---------------------------------------------------------
  // ANALYTICS
  // ---------------------------------------------------------

  const totalPackages = packages.length;

  const activePackages = packages.filter(
    (pkg) => pkg.status === 'active'
  ).length;

  /*
   * Supports several possible backend field names.
   * This means the frontend won't break if your backend
   * currently calls the field enrolled_count, bookings_count,
   * or slots_booked.
   */

  // Only CONFIRMED bookings occupy slots (backend enrolled_count is confirmed-only).
  const getEnrolled = (pkg) => {
    return Number(
      pkg.enrolled_count ??
        pkg.enrollment_count ??
        pkg.bookings_count ??
        pkg.slots_booked ??
        0
    );
  };

  const getCapacity = (pkg) => {
    return Number(
      pkg.max_group_size ??
        pkg.capacity ??
        0
    );
  };

  const totalTravelers = packages.reduce(
    (sum, pkg) => sum + getEnrolled(pkg),
    0
  );

  const totalCapacity = packages.reduce(
    (sum, pkg) => sum + getCapacity(pkg),
    0
  );

  const overallEnrollment =
    totalCapacity > 0
      ? Math.round(
          (totalTravelers / totalCapacity) * 100
        )
      : 0;

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#172033]">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <section className="border-b border-[#e5e7eb]">
        <div className="max-w-[1280px] mx-auto px-6 pt-12 pb-10">

          <div className="
            flex
            flex-col
            md:flex-row
            md:items-end
            md:justify-between
            gap-6
          ">

            <div>
              <h1 className="
                text-[34px]
                md:text-[40px]
                leading-tight
                font-bold
                tracking-[-0.7px]
                text-[#172033]
              ">
                Company dashboard
              </h1>

              <p className="
                mt-3
                text-[16px]
                text-[#5f6b7a]
                max-w-2xl
                leading-6
              ">
                Manage your travel packages and monitor
                traveler activity.
              </p>
            </div>

            <button
              onClick={() => setShowForm((s) => !s)}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                bg-[#00aa6c]
                hover:bg-[#008f5b]
                text-white
                font-semibold
                text-[15px]
                px-6
                py-3
                rounded-full
                transition
                whitespace-nowrap
              "
            >
              <span className="text-[20px] leading-none">
                {showForm ? '×' : '+'}
              </span>

              {showForm
                ? 'Cancel'
                : 'Create a package'}
            </button>

          </div>

        </div>
      </section>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-[1280px] mx-auto px-6 py-8">


        {/* ===================================================
            ANALYTICS
        =================================================== */}

        <section className="mb-10">

          <div className="flex items-end justify-between mb-5">

            <div>
              <h2 className="
                text-[24px]
                font-bold
                text-[#172033]
              ">
                Traveler analytics
              </h2>

              <p className="
                text-[14px]
                text-[#687386]
                mt-1
              ">
                An overview of traveler enrollment across
                your packages.
              </p>
            </div>

          </div>


          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-4
          ">

            {/* Total packages */}

            <div className="
              border
              border-[#dfe3e7]
              rounded-xl
              p-5
              bg-white
            ">
              <p className="
                text-[13px]
                font-medium
                text-[#687386]
              ">
                Total packages
              </p>

              <p className="
                text-[30px]
                font-bold
                text-[#172033]
                mt-1
              ">
                {totalPackages}
              </p>

              <p className="
                text-[12px]
                text-[#687386]
                mt-1
              ">
                {activePackages} currently active
              </p>
            </div>


            {/* Travelers */}

            <div className="
              border
              border-[#dfe3e7]
              rounded-xl
              p-5
              bg-white
            ">
              <p className="
                text-[13px]
                font-medium
                text-[#687386]
              ">
                Enrolled travelers
              </p>

              <p className="
                text-[30px]
                font-bold
                text-[#00a680]
                mt-1
              ">
                {totalTravelers}
              </p>

              <p className="
                text-[12px]
                text-[#687386]
                mt-1
              ">
                Across all packages
              </p>
            </div>


            {/* Capacity */}

            <div className="
              border
              border-[#dfe3e7]
              rounded-xl
              p-5
              bg-white
            ">
              <p className="
                text-[13px]
                font-medium
                text-[#687386]
              ">
                Total capacity
              </p>

              <p className="
                text-[30px]
                font-bold
                text-[#172033]
                mt-1
              ">
                {totalCapacity}
              </p>

              <p className="
                text-[12px]
                text-[#687386]
                mt-1
              ">
                Available traveler spaces
              </p>
            </div>


            {/* Enrollment */}

            <div className="
              border
              border-[#dfe3e7]
              rounded-xl
              p-5
              bg-white
            ">
              <p className="
                text-[13px]
                font-medium
                text-[#687386]
              ">
                Overall enrollment
              </p>

              <p className="
                text-[30px]
                font-bold
                text-[#00a680]
                mt-1
              ">
                {overallEnrollment}%
              </p>

              <div className="
                mt-3
                h-2
                bg-[#e8eeee]
                rounded-full
                overflow-hidden
              ">
                <div
                  className="
                    h-full
                    bg-[#00aa6c]
                    rounded-full
                  "
                  style={{
                    width: `${Math.min(
                      overallEnrollment,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

          </div>
        </section>


        {/* ===================================================
            CREATE PACKAGE FORM
        =================================================== */}

        {showForm && (
          <section className="
            border
            border-[#dfe3e7]
            rounded-xl
            bg-white
            mb-10
            overflow-hidden
          ">

            <div className="
              px-6
              py-5
              border-b
              border-[#e5e7eb]
              bg-[#fafafa]
            ">

              <h2 className="
                text-[22px]
                font-bold
                text-[#172033]
              ">
                Create a new package
              </h2>

              <p className="
                text-[14px]
                text-[#687386]
                mt-1
              ">
                Add the details travelers need for your trip.
              </p>

            </div>


            <form
              onSubmit={submit}
              className="p-6"
            >

              <div className="space-y-6">

                {/* TITLE */}

                <div>
                  <label className="
                    block
                    text-[14px]
                    font-semibold
                    mb-2
                  ">
                    Package title
                  </label>

                  <input
                    required
                    value={form.title}
                    onChange={update('title')}
                    placeholder="e.g. Discover Cox's Bazar"
                    className="
                      w-full
                      h-[48px]
                      px-4
                      border
                      border-[#cfd5db]
                      rounded-lg
                      text-[15px]
                      outline-none
                      focus:border-[#00aa6c]
                      focus:ring-1
                      focus:ring-[#00aa6c]
                    "
                  />
                </div>


                {/* DESCRIPTION */}

                <div>
                  <label className="
                    block
                    text-[14px]
                    font-semibold
                    mb-2
                  ">
                    Description
                  </label>

                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={update('description')}
                    placeholder="Describe the experience travelers can expect..."
                    className="
                      w-full
                      px-4
                      py-3
                      border
                      border-[#cfd5db]
                      rounded-lg
                      text-[15px]
                      outline-none
                      resize-none
                      focus:border-[#00aa6c]
                      focus:ring-1
                      focus:ring-[#00aa6c]
                    "
                  />
                </div>


                {/* IMAGE */}

                <div>
                  <label className="block text-[14px] font-semibold mb-2">
                    Package image
                  </label>

                  <div className="flex flex-col md:flex-row gap-4">

                    <div className="
                      w-full md:w-[260px] h-[170px] shrink-0
                      rounded-lg border border-dashed border-[#cfd5db]
                      bg-[#f7f9f9] overflow-hidden
                      flex items-center justify-center
                    ">
                      {form.image_url ? (
                        <img
                          src={form.image_url}
                          alt="Package preview"
                          className="w-full h-full object-cover"
                          onError={() => setImageError("Couldn't load an image from that link.")}
                        />
                      ) : (
                        <div className="text-center text-[#718096] px-4">
                          <div className="text-[28px] mb-1">🖼</div>
                          <p className="text-[13px]">No image selected</p>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">

                      <input
                        value={form.image_url}
                        onChange={(e) => {
                          setImageError('');
                          setForm((current) => ({ ...current, image_url: e.target.value.trim() }));
                        }}
                        placeholder="Paste an image link (https://…)"
                        className="
                          w-full h-[44px] px-4 border border-[#cfd5db] rounded-lg
                          text-[14px] outline-none
                          focus:border-[#00aa6c] focus:ring-1 focus:ring-[#00aa6c]
                        "
                      />

                      {form.image_url && (
                        <button
                          type="button"
                          onClick={clearImage}
                          className="text-[13px] font-medium text-[#687386] hover:text-red-600"
                        >
                          Remove image
                        </button>
                      )}

                      <p className="text-xs text-[#687386]">
                        Paste a direct link to an image (JPG, PNG or WebP).
                        This is the picture travelers see for your package.
                      </p>

                      {imageError && (
                        <p className="text-xs text-red-600">{imageError}</p>
                      )}

                    </div>

                  </div>
                </div>


                {/* DESTINATION */}

                <div>
                  <label className="
                    block
                    text-[14px]
                    font-semibold
                    mb-2
                  ">
                    Destination
                  </label>

                  <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-4
                  ">

                    <input
                      required
                      value={form.destination_city}
                      onChange={update('destination_city')}
                      placeholder="City"
                      className="
                        h-[48px]
                        px-4
                        border
                        border-[#cfd5db]
                        rounded-lg
                        outline-none
                        focus:border-[#00aa6c]
                      "
                    />

                    <input
                      required
                      value={form.destination_country}
                      onChange={update('destination_country')}
                      placeholder="Country"
                      className="
                        h-[48px]
                        px-4
                        border
                        border-[#cfd5db]
                        rounded-lg
                        outline-none
                        focus:border-[#00aa6c]
                      "
                    />

                  </div>
                </div>


                {/* DETAILS */}

                <div>

                  <label className="
                    block
                    text-[14px]
                    font-semibold
                    mb-2
                  ">
                    Package details
                  </label>

                  <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-3
                    gap-4
                  ">

                    <div>
                      <input
                        type="number"
                        min={1}
                        value={form.duration_days}
                        onChange={update('duration_days')}
                        className="
                          w-full
                          h-[48px]
                          px-4
                          border
                          border-[#cfd5db]
                          rounded-lg
                          outline-none
                          focus:border-[#00aa6c]
                        "
                      />

                      <p className="text-xs text-[#687386] mt-1.5">
                        Duration in days
                      </p>
                    </div>


                    <div>
                      <input
                        type="number"
                        min={0}
                        value={form.base_price}
                        onChange={update('base_price')}
                        className="
                          w-full
                          h-[48px]
                          px-4
                          border
                          border-[#cfd5db]
                          rounded-lg
                          outline-none
                          focus:border-[#00aa6c]
                        "
                      />

                      <p className="text-xs text-[#687386] mt-1.5">
                        Price per traveler
                      </p>
                    </div>


                    <div>
                      <input
                        type="number"
                        min={1}
                        value={form.max_group_size}
                        onChange={update('max_group_size')}
                        className="
                          w-full
                          h-[48px]
                          px-4
                          border
                          border-[#cfd5db]
                          rounded-lg
                          outline-none
                          focus:border-[#00aa6c]
                        "
                      />

                      <p className="text-xs text-[#687386] mt-1.5">
                        Maximum travelers
                      </p>
                    </div>

                  </div>

                </div>


                {/* DATES */}

                <div>

                  <label className="
                    block
                    text-[14px]
                    font-semibold
                    mb-2
                  ">
                    Travel dates
                  </label>

                  <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-4
                  ">

                    <input
                      type="date"
                      value={form.start_date}
                      onChange={update('start_date')}
                      className="
                        h-[48px]
                        px-4
                        border
                        border-[#cfd5db]
                        rounded-lg
                        outline-none
                        focus:border-[#00aa6c]
                      "
                    />

                    <input
                      type="date"
                      value={form.end_date}
                      onChange={update('end_date')}
                      className="
                        h-[48px]
                        px-4
                        border
                        border-[#cfd5db]
                        rounded-lg
                        outline-none
                        focus:border-[#00aa6c]
                      "
                    />

                  </div>

                </div>


                {/* ACTIONS */}

                <div className="
                  pt-2
                  flex
                  justify-end
                  gap-3
                ">

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="
                      px-5
                      py-2.5
                      rounded-full
                      border
                      border-[#cfd5db]
                      text-[#172033]
                      text-[14px]
                      font-semibold
                      hover:bg-[#f7f8f9]
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      px-6
                      py-2.5
                      rounded-full
                      bg-[#00aa6c]
                      text-white
                      text-[14px]
                      font-semibold
                      hover:bg-[#008f5b]
                      disabled:opacity-60
                    "
                  >
                    {loading
                      ? 'Publishing...'
                      : 'Publish package'}
                  </button>

                </div>

              </div>

            </form>

          </section>
        )}


        {/* ===================================================
            PACKAGES
        =================================================== */}

        <section>

          <div className="
            flex
            flex-col
            sm:flex-row
            sm:items-end
            sm:justify-between
            gap-3
            mb-5
          ">

            <div>

              <h2 className="
                text-[24px]
                font-bold
                text-[#172033]
              ">
                Your packages
              </h2>

              <p className="
                text-[14px]
                text-[#687386]
                mt-1
              ">
                Manage packages and see who has enrolled.
              </p>

            </div>

            {packages.length > 0 && (
              <span className="
                text-[14px]
                text-[#687386]
              ">
                {packages.length} package
                {packages.length !== 1
                  ? 's'
                  : ''}
              </span>
            )}

          </div>


          {/* PACKAGE GRID */}

          {packages.length > 0 ? (

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-5
            ">

              {packages.map((pkg) => {

                const enrolled = getEnrolled(pkg);
                const capacity = getCapacity(pkg);

                const percentage =
                  capacity > 0
                    ? Math.round(
                        (enrolled / capacity) *
                          100
                      )
                    : 0;

                return (
                  <article
                    key={pkg.package_id}
                    className="
                      border
                      border-[#dfe3e7]
                      rounded-xl
                      bg-white
                      overflow-hidden
                      hover:shadow-[0_3px_12px_rgba(0,0,0,0.08)]
                      transition
                    "
                  >

                    {/* IMAGE */}

                    <div className="h-[170px] bg-[#eef3f2] overflow-hidden relative">

                      {!brokenImages[pkg.package_id] ? (
                        <img
                          src={pkg.image_url || getBookingImage({ package_id: pkg.package_id })}
                          alt={pkg.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={() =>
                            setBrokenImages((current) => ({
                              ...current,
                              [pkg.package_id]: true,
                            }))
                          }
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-center text-[#718096]">
                          <div>
                            <div className="text-[30px] mb-1">✈</div>
                            <p className="text-[13px]">{pkg.destination_city}</p>
                          </div>
                        </div>
                      )}

                    </div>


                    <div className="p-5">

                      {/* TITLE + STATUS */}

                      <div className="
                        flex
                        justify-between
                        items-start
                        gap-4
                      ">

                        <div>

                          <h3 className="
                            text-[20px]
                            font-bold
                            text-[#172033]
                            leading-tight
                          ">
                            {pkg.title}
                          </h3>

                          <p className="
                            text-[14px]
                            text-[#687386]
                            mt-1.5
                          ">
                            {pkg.destination_city},{' '}
                            {pkg.destination_country}
                            {' · '}
                            {pkg.duration_days} days
                          </p>

                        </div>


                        <span
                          className={`
                            shrink-0
                            text-[12px]
                            font-semibold
                            px-3
                            py-1
                            rounded-full
                            ${
                              pkg.status === 'active'
                                ? 'bg-[#e8f7f1] text-[#008f5b]'
                                : pkg.status === 'fully_booked'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-[#f0f1f2] text-[#697586]'
                            }
                          `}
                        >
                          {pkg.status === 'active'
                            ? 'Active'
                            : pkg.status === 'fully_booked'
                            ? 'Fully booked'
                            : 'Inactive'}
                        </span>

                      </div>


                      {/* DESCRIPTION */}

                      {pkg.description && (
                        <p className="
                          mt-4
                          text-[14px]
                          leading-5
                          text-[#4f5d6d]
                          line-clamp-2
                        ">
                          {pkg.description}
                        </p>
                      )}


                      {/* ENROLLMENT */}

                      <div className="
                        mt-5
                        p-4
                        bg-[#f7f9f9]
                        rounded-lg
                      ">

                        <div className="
                          flex
                          justify-between
                          items-center
                          mb-2
                        ">

                          <div>

                            <p className="
                              text-[13px]
                              font-semibold
                              text-[#172033]
                            ">
                              Traveler enrollment
                            </p>

                            <p className="
                              text-[12px]
                              text-[#687386]
                              mt-0.5
                            ">
                              {enrolled} of {capacity}{' '}
                              travelers confirmed
                              {Number(pkg.pending_count) > 0 &&
                                ` · ${pkg.pending_count} awaiting confirmation`}
                            </p>

                          </div>

                          <span className="
                            text-[14px]
                            font-bold
                            text-[#00a680]
                          ">
                            {percentage}%
                          </span>

                        </div>


                        <div className="
                          h-2
                          bg-[#dfe8e5]
                          rounded-full
                          overflow-hidden
                        ">

                          <div
                            className="
                              h-full
                              bg-[#00aa6c]
                              rounded-full
                            "
                            style={{
                              width: `${Math.min(
                                percentage,
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>


                      {/* PRICE / SLOTS */}

                      <div className="
                        border-t
                        border-[#e7e9ec]
                        mt-5
                        pt-5
                        flex
                        items-end
                        justify-between
                      ">

                        <div>

                          <p className="
                            text-[12px]
                            text-[#737f8d]
                          ">
                            From
                          </p>

                          <p className="
                            text-[21px]
                            font-bold
                            text-[#172033]
                          ">
                            $
                            {Number(
                              pkg.base_price
                            ).toLocaleString()}
                          </p>

                          <p className="
                            text-[12px]
                            text-[#737f8d]
                          ">
                            per traveler
                          </p>

                        </div>


                        <div className="text-right">

                          <p className="
                            text-[12px]
                            text-[#737f8d]
                          ">
                            Remaining
                          </p>

                          <p className="
                            text-[16px]
                            font-bold
                            text-[#172033]
                          ">
                            {Math.max(
                              capacity - enrolled,
                              0
                            )}{' '}
                            slots
                          </p>

                        </div>

                      </div>


                      {/* BUTTONS */}

                      <div className="
                        mt-5
                        flex
                        items-center
                        justify-between
                        gap-4
                      ">

                        <button
                          onClick={() =>
                            viewTravelers(pkg)
                          }
                          className="
                            text-[14px]
                            font-semibold
                            text-[#008f5b]
                            hover:text-[#006f47]
                          "
                        >
                          View enrolled travelers
                        </button>

                        <button
                          onClick={() =>
                            toggleStatus(pkg)
                          }
                          className="
                            text-[13px]
                            font-medium
                            text-[#687386]
                            hover:text-[#172033]
                          "
                        >
                          {pkg.status === 'inactive'
                            ? 'Activate'
                            : 'Deactivate'}
                        </button>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>

          ) : (

            /* EMPTY */

            <div className="
              border
              border-[#dfe3e7]
              rounded-xl
              py-20
              text-center
            ">

              <div className="
                w-14
                h-14
                mx-auto
                rounded-full
                bg-[#e8f7f1]
                flex
                items-center
                justify-center
                text-[#00aa6c]
                text-2xl
              ">
                +
              </div>

              <h3 className="
                text-[20px]
                font-bold
                text-[#172033]
                mt-4
              ">
                No packages yet
              </h3>

              <p className="
                text-[14px]
                text-[#687386]
                mt-1
              ">
                Create a package to start offering
                trips to travelers.
              </p>

              <button
                onClick={() => setShowForm(true)}
                className="
                  mt-5
                  px-6
                  py-2.5
                  rounded-full
                  bg-[#00aa6c]
                  text-white
                  text-[14px]
                  font-semibold
                  hover:bg-[#008f5b]
                "
              >
                Create a package
              </button>

            </div>

          )}

        </section>

      </main>


      {/* =====================================================
          TRAVELER MODAL
      ===================================================== */}

      {selectedPackage && (
        <div className="
          fixed
          inset-0
          z-50
          bg-black/40
          flex
          items-center
          justify-center
          p-4
        ">

          <div className="
            bg-white
            w-full
            max-w-[1000px]
            max-h-[90vh]
            rounded-2xl
            overflow-hidden
            shadow-2xl
            flex
            flex-col
          ">

            {/* MODAL HEADER */}

            <div className="
              px-6
              py-5
              border-b
              border-[#e5e7eb]
              flex
              items-start
              justify-between
              gap-4
            ">

              <div>

                <p className="
                  text-[12px]
                  font-semibold
                  text-[#00a680]
                  uppercase
                  tracking-wide
                ">
                  Enrolled travelers
                </p>

                <h2 className="
                  text-[22px]
                  font-bold
                  text-[#172033]
                  mt-1
                ">
                  {selectedPackage.title}
                </h2>

                <p className="
                  text-[13px]
                  text-[#687386]
                  mt-1
                ">
                  {selectedPackage.destination_city},{' '}
                  {selectedPackage.destination_country}
                </p>

              </div>


              <button
                onClick={closeTravelers}
                className="
                  w-9
                  h-9
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-xl
                  text-[#687386]
                  hover:bg-[#f1f3f4]
                "
              >
                ×
              </button>

            </div>


            {/* SEARCH */}

            <div className="
              px-6
              py-4
              border-b
              border-[#e5e7eb]
              bg-[#fafafa]
            ">

              <div className="
                flex
                flex-col
                md:flex-row
                md:items-center
                justify-between
                gap-3
              ">

                <div className="relative w-full md:max-w-[420px]">

                  <span className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-[#7b8794]
                  ">
                    ⌕
                  </span>

                  <input
                    value={travelerSearch}
                    onChange={(e) =>
                      setTravelerSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search travelers..."
                    className="
                      w-full
                      h-[44px]
                      pl-10
                      pr-4
                      border
                      border-[#cfd5db]
                      rounded-lg
                      bg-white
                      text-[14px]
                      outline-none
                      focus:border-[#00aa6c]
                    "
                  />

                </div>

                <span className="
                  text-[13px]
                  text-[#687386]
                ">
                  {confirmedTravelers.length} confirmed
                  {pendingTravelers.length > 0 &&
                    ` · ${pendingTravelers.length} awaiting`}
                </span>

              </div>

            </div>


            {/* TRAVELER LISTS */}

            <div className="overflow-auto flex-1">

              {loadingTravelers ? (

                <div className="flex items-center justify-center py-20 text-[14px] text-[#687386]">
                  Loading travelers...
                </div>

              ) : (
                <>

                  {/* CONFIRMED — these occupy slots */}

                  <div className="px-6 pt-5 pb-2 flex items-center justify-between">
                    <div>
                      <h3 className="text-[15px] font-bold text-[#172033]">
                        Confirmed travelers
                      </h3>
                      <p className="text-[12px] text-[#687386] mt-0.5">
                        Confirmed bookings only. These travelers occupy the package slots.
                      </p>
                    </div>
                    <span className="text-[12px] font-semibold text-[#008f5b] bg-[#e8f7f1] px-3 py-1 rounded-full">
                      {confirmedSeats} / {selectedCapacity} slots
                    </span>
                  </div>

                  {confirmedTravelers.length > 0 ? (
                    <TravelerTable rows={confirmedTravelers} />
                  ) : (
                    <p className="px-6 py-8 text-center text-[13px] text-[#687386]">
                      {travelers.length === 0
                        ? 'No bookings yet.'
                        : 'No confirmed travelers match your search.'}
                    </p>
                  )}


                  {/* PENDING — do not occupy slots */}

                  {pendingTravelers.length > 0 && (
                    <>
                      <div className="px-6 pt-6 pb-2 border-t border-[#e5e7eb] mt-4">
                        <h3 className="text-[15px] font-bold text-amber-700">
                          Joined · awaiting confirmation
                        </h3>
                        <p className="text-[12px] text-[#687386] mt-0.5">
                          These travelers booked but are not confirmed yet, so they do not occupy a slot.
                        </p>
                      </div>

                      <TravelerTable rows={pendingTravelers} pending />
                    </>
                  )}

                </>
              )}

            </div>


            {/* MODAL FOOTER */}

            <div className="
              px-6
              py-4
              border-t
              border-[#e5e7eb]
              bg-[#fafafa]
              flex
              justify-end
            ">

              <button
                onClick={closeTravelers}
                className="
                  px-5
                  py-2.5
                  rounded-full
                  border
                  border-[#cfd5db]
                  text-[14px]
                  font-semibold
                  text-[#172033]
                  hover:bg-white
                "
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// ---------------------------------------------------------
// Traveler table used inside the enrolled-travelers modal
// ---------------------------------------------------------

function TravelerTable({ rows, pending = false }) {
  const th = 'px-4 py-3 text-[12px] font-semibold text-[#687386] uppercase';

  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-[#f7f8f9] border-y border-[#e5e7eb]">
        <tr>
          <th className={`${th} px-6`}>Traveler</th>
          <th className={th}>Members</th>
          <th className={th}>Booked</th>
          <th className={th}>Status</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((traveler, index) => (
          <tr
            key={traveler.booking_id || traveler.id || index}
            className="border-b border-[#edf0f2] hover:bg-[#fafcfc]"
          >
            <td className="px-6 py-4">
              <p className="text-[14px] font-semibold text-[#172033]">
                {traveler.name || traveler.full_name || 'Unknown traveler'}
              </p>
              <p className="text-[12px] text-[#687386] mt-0.5">
                {traveler.email || '—'}
              </p>
              {traveler.mobile && (
                <p className="text-[12px] text-[#687386]">{traveler.mobile}</p>
              )}
            </td>

            <td className="px-4 py-4 text-[13px] text-[#4f5d6d]">
              {traveler.members || traveler.group_size || 1}
            </td>

            <td className="px-4 py-4 text-[13px] text-[#4f5d6d]">
              {traveler.created_at
                ? new Date(traveler.created_at).toLocaleDateString()
                : '—'}
            </td>

            <td className="px-4 py-4">
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  pending
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-[#e8f7f1] text-[#008f5b]'
                }`}
              >
                {pending
                  ? traveler.payment_status === 'paid'
                    ? 'Awaiting confirmation'
                    : 'Payment pending'
                  : 'Confirmed'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
