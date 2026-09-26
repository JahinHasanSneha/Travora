const TRAVEL_IMAGES = [
    "/images/backgrounds/travel1.jpeg",
    "/images/backgrounds/travel2.jpeg",
    "/images/backgrounds/travel3.jpeg",
    "/images/backgrounds/travel4.jpeg",
    "/images/backgrounds/travel5.jpeg",
    "/images/backgrounds/travel6.jpeg",
    "/images/backgrounds/travel7.jpeg",
    "/images/backgrounds/travel8.jpeg",
    "/images/backgrounds/travel9.jpeg",
    "/images/backgrounds/travel10.jpeg",
  ];
  
  export function getBookingImage(booking) {
    if (!booking) return TRAVEL_IMAGES[0];
  
    const fromBackend =
      booking.image_url ||
      booking.package_image ||
      booking.trip_image ||
      booking.destination_image;
  
    if (fromBackend) return fromBackend;
  
    const seed =
      Number(booking.booking_id) ||
      Number(booking.trip_id) ||
      Number(booking.package_id) ||
      0;
  
    return TRAVEL_IMAGES[seed % TRAVEL_IMAGES.length];
  }
  
  export { TRAVEL_IMAGES };
  