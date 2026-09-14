import type { BookResult, ImageResult, NewsResult, PlaceResult, ProductResult, VideoResult } from '../types'

const imageSeeds = ['photo-1516321318423-f06f85e504b3', 'photo-1555066931-4365d14bab8c', 'photo-1498050108023-c5249f4df085', 'photo-1515879218367-8466d910aaa4', 'photo-1558655146-d09347e92766', 'photo-1461749280684-dccba630e2f6']
export const mockImages: ImageResult[] = imageSeeds.map((seed, index) => ({ id: `image-${index}`, title: ['Modern web development', 'Developer workspace', 'Code on a screen', 'Programming concepts', 'Digital architecture', 'Open source project'][index], source: ['Unsplash', 'Pexels', 'Wikimedia Commons'][index % 3], domain: ['unsplash.com', 'pexels.com', 'commons.wikimedia.org'][index % 3], imageUrl: `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=720&q=80`, width: 720, height: index % 2 ? 480 : 540 }))

export const mockVideos: VideoResult[] = [
  { id: 'video-1', title: 'Java OOP in 10 minutes', source: 'Code Lab', domain: 'video.example', thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=720&q=80', duration: '10:24', description: 'A concise visual introduction to objects, classes, inheritance, and polymorphism.', published: '2 weeks ago' },
  { id: 'video-2', title: 'How software architecture evolves', source: 'The Systems Room', domain: 'video.example', thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=720&q=80', duration: '24:08', description: 'A practical conversation about building systems that remain understandable.', published: '1 month ago' },
  { id: 'video-3', title: 'A visual guide to clean code', source: 'Open Lecture', domain: 'video.example', thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=720&q=80', duration: '18:52', description: 'Patterns and habits that make code easier to read and maintain.', published: '3 months ago' },
]

export const mockNews: NewsResult[] = [
  { id: 'news-1', headline: 'Open source communities are rethinking the software stack', publisher: 'The Independent Ledger', timestamp: '2 hours ago', description: 'Maintainers and developers are focusing on durable tools, transparent governance, and sustainable infrastructure.' },
  { id: 'news-2', headline: 'Why privacy is becoming a product requirement', publisher: 'Signal Journal', timestamp: 'Yesterday', description: 'People are asking for more control over the systems that mediate their daily information.' },
  { id: 'news-3', headline: 'The next generation of web infrastructure', publisher: 'Protocol Review', timestamp: '3 days ago', description: 'A look at the ideas shaping independent indexes and more resilient digital ecosystems.' },
]

export const mockPlaces: PlaceResult[] = [
  { id: 'place-1', name: 'Northstar Coffee Lab', category: 'Coffee shop', rating: 4.8, address: '14 Mercer Street, Downtown', openingStatus: 'Open until 6:00 PM', distance: '0.4 mi', website: 'northstar.example' },
  { id: 'place-2', name: 'The Workshop Library', category: 'Independent bookstore', rating: 4.7, address: '88 Orchard Avenue, East Village', openingStatus: 'Open until 8:00 PM', distance: '1.1 mi', website: 'workshop.example' },
  { id: 'place-3', name: 'Field Notes Kitchen', category: 'Restaurant', rating: 4.6, address: '201 Franklin Road, Midtown', openingStatus: 'Opens at 11:30 AM', distance: '1.8 mi', website: 'fieldnotes.example' },
]

export const mockProducts: ProductResult[] = [
  { id: 'product-1', name: 'The Art of Doing Science and Engineering', price: '$24.00', store: 'Bookshop', rating: 4.8, availability: 'In stock', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=360&q=80' },
  { id: 'product-2', name: 'Mechanical Keyboard / Quiet Edition', price: '$129.00', store: 'Independent Hardware', rating: 4.6, availability: 'Ships tomorrow', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=360&q=80' },
  { id: 'product-3', name: 'Field Notes Desk Lamp', price: '$88.00', store: 'Object Studio', rating: 4.9, availability: 'Limited stock', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=360&q=80' },
]

export const mockBooks: BookResult[] = [
  { id: 'book-1', title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', publicationDate: '1999', description: 'A classic guide to the habits, techniques, and principles that make software development more effective.', source: 'Library Index', coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=320&q=80' },
  { id: 'book-2', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', publicationDate: '2017', description: 'A detailed tour of the principles and practical tradeoffs behind reliable, scalable data systems.', source: 'Library Index', coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=320&q=80' },
  { id: 'book-3', title: 'The Elements of Computing Systems', author: 'Noam Nisan & Shimon Schocken', publicationDate: '2005', description: 'Build a modern computer from first principles, from logic gates to software hierarchy.', source: 'Library Index', coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=320&q=80' },
]
