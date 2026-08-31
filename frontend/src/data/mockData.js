// Seed Taxonomy & Initial Mock Data for CardFlow

export const categories = [
  { id: 'cat-1', name: 'Manufacturing', icon: 'Factory', count: 42, slug: 'manufacturing' },
  { id: 'cat-2', name: 'IT & Software', icon: 'Code', count: 36, slug: 'it-software' },
  { id: 'cat-3', name: 'Textiles & Garments', icon: 'Shirt', count: 29, slug: 'textiles' },
  { id: 'cat-4', name: 'Hardware & Tools', icon: 'Wrench', count: 24, slug: 'hardware' },
  { id: 'cat-5', name: 'Electrical & Automation', icon: 'Zap', count: 18, slug: 'electrical' },
  { id: 'cat-6', name: 'Construction & Civil', icon: 'Building2', count: 22, slug: 'construction' },
  { id: 'cat-7', name: 'Logistics & Transport', icon: 'Truck', count: 15, slug: 'logistics' },
  { id: 'cat-8', name: 'Consultants & CA', icon: 'Briefcase', count: 19, slug: 'consultants' },
  { id: 'cat-9', name: 'Printing & Packaging', icon: 'Printer', count: 14, slug: 'printing' },
  { id: 'cat-10', name: 'Health & Medical', icon: 'Stethoscope', count: 20, slug: 'health' }
];

export const mockBusinesses = [
  {
    id: 'biz-1',
    name: 'Kovai Precision Tools',
    slug: 'kovai-precision-tools',
    ownerPhone: '9876543210',
    description: 'Leading manufacturers of CNC machined precision components, hydraulic valves, and automotive fittings.',
    category: 'Manufacturing',
    categoryId: 'cat-1',
    rating: 4.8,
    reviewsCount: 34,
    distanceKm: 1.2,
    pincode: '641004',
    locality: 'Peelamedu',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    address: '42, SIDCO Industrial Estate, Peelamedu, Coimbatore - 641004',
    phone: '+919443012345',
    email: 'contact@kovaiprecision.com',
    website: 'https://kovaiprecision.com',
    verification: 'gst', // 'gst' | 'pan' | 'tan' | 'none'
    verificationLabel: 'GST Verified',
    gstin: '33AAAAA0000A1Z5',
    services: ['CNC Milling', 'Hydraulic Valves', 'Lathe Machining', 'Custom Tooling', 'Surface Grinding'],
    hours: 'Mon - Sat: 9:00 AM - 6:30 PM',
    yearEstablished: 2012,
    photosCount: 6,
    enquiriesCount: 14,
    viewsCount: 284,
    digitalCard: {
      template: 'bold',
      brandColor: '#2563EB',
      title: 'Managing Director',
      ownerName: 'Suresh Natarajan'
    }
  },
  {
    id: 'biz-2',
    name: 'Apex Infotech Solutions',
    slug: 'apex-infotech-solutions',
    ownerPhone: '9876543210', // Same business owner with multiple businesses!
    description: 'Enterprise ERP, Cloud Migration, and Custom Web & Mobile Application Development for MSMEs.',
    category: 'IT & Software',
    categoryId: 'cat-2',
    rating: 4.9,
    reviewsCount: 52,
    distanceKm: 2.8,
    pincode: '641018',
    locality: 'Gandhipuram',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    address: '105, Cross Cut Road, Gandhipuram, Coimbatore - 641018',
    phone: '+919842155678',
    email: 'hello@apexinfotech.in',
    website: 'https://apexinfotech.in',
    verification: 'gst',
    verificationLabel: 'GST Verified',
    gstin: '33BBBBB1111B2Z6',
    services: ['Cloud ERP', 'React Native Apps', 'SaaS Development', 'Cybersecurity Audit', 'AI Integrations'],
    hours: 'Mon - Fri: 9:30 AM - 6:30 PM',
    yearEstablished: 2018,
    photosCount: 8,
    enquiriesCount: 28,
    viewsCount: 490,
    digitalCard: {
      template: 'clean',
      brandColor: '#4F46E5',
      title: 'Founder & CTO',
      ownerName: 'Suresh Natarajan'
    }
  },
  {
    id: 'biz-3',
    name: 'Sri Lakshmi Tex Mills',
    slug: 'sri-lakshmi-tex-mills',
    ownerPhone: '9843219876',
    description: '100% Combed Cotton Yarn & Organic Knitted Fabrics manufacturers and global exporters.',
    category: 'Textiles & Garments',
    categoryId: 'cat-3',
    rating: 4.7,
    reviewsCount: 19,
    distanceKm: 4.5,
    pincode: '641015',
    locality: 'Singanallur',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    address: '78, Trichy Road, Singanallur, Coimbatore - 641015',
    phone: '+919894011223',
    email: 'orders@srilakshmitex.com',
    website: 'https://srilakshmitex.com',
    verification: 'gst',
    verificationLabel: 'GST Verified',
    gstin: '33CCCCC2222C3Z7',
    services: ['Combed Cotton Yarn', 'Organic Knitted Fabric', 'Custom Dyeing', 'Bulk Export'],
    hours: 'Mon - Sat: 8:30 AM - 7:00 PM',
    yearEstablished: 2005,
    photosCount: 10,
    enquiriesCount: 42,
    viewsCount: 610,
    digitalCard: {
      template: 'classic',
      brandColor: '#059669',
      title: 'Proprietor',
      ownerName: 'K. Lakshmi Narayanan'
    }
  }
];

export const mockSavedCards = [
  {
    id: 'card-1',
    personName: 'Ramesh Sundaram',
    designation: 'Senior CA & Tax Advisor',
    company: 'Sundaram & Associates CA',
    phones: [{ raw: '+91 98430 99887', isWhatsapp: true, label: 'Work' }],
    emails: ['ramesh@sundaramca.in'],
    website: 'https://sundaramca.in',
    rawAddress: '14, Race Course Road, Coimbatore - 641018',
    notes: 'Met at BNI Coimbatore Achievers chapter meeting. Expert in GST appeals.',
    privateRating: 5,
    tags: ['CA / Finance', 'BNI Chapter', 'Vendor'],
    savedAt: '2026-08-25',
    hasFrontImage: true,
    hasBackImage: false,
    extractStatus: 'extracted'
  },
  {
    id: 'card-2',
    personName: 'Anitha Rajendran',
    designation: 'Managing Partner',
    company: 'Vanguard Industrial Automation',
    phones: [{ raw: '+91 97890 44332', isWhatsapp: true, label: 'Mobile' }],
    emails: ['anitha@vanguardauto.in'],
    website: 'https://vanguardauto.in',
    rawAddress: 'Plot 18, CODISSIA Industrial Park, Myleripalayam, Coimbatore',
    notes: 'Provides PLC and SCADA controllers for CNC machinery.',
    privateRating: 4,
    tags: ['Supplier', 'Automation', 'CODISSIA'],
    savedAt: '2026-08-27',
    hasFrontImage: true,
    hasBackImage: true,
    extractStatus: 'extracted'
  }
];
