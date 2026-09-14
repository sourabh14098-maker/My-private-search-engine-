import type { SearchResponse } from '../types'

const results = [
  { id: 'java-1', domain: 'dev.java', title: 'Object-Oriented Programming Concepts', description: 'Explore the building blocks of Java: objects, classes, inheritance, interfaces, and encapsulation, with clear examples from the official Java learning path.', url: 'dev.java/learn/oop', metadata: 'Official learning path' },
  { id: 'java-2', domain: 'docs.oracle.com', title: 'Object-Oriented Programming Concepts', description: 'Learn about objects, classes, inheritance, interfaces, and packages in this guide to the core concepts that make Java an object-oriented language.', url: 'docs.oracle.com/javase/tutorial/java/concepts/', metadata: 'Java Tutorials' },
  { id: 'java-3', domain: 'openjdk.org', title: 'The Java Platform', description: 'The OpenJDK community builds and maintains the Java platform. Find documentation, project information, and resources for modern Java development.', url: 'openjdk.org', metadata: 'OpenJDK community' },
  { id: 'java-4', domain: 'martinfowler.com', title: 'Refactoring and the Java ecosystem', description: 'Thoughtful notes on designing maintainable software, evolving a codebase, and making object-oriented systems easier to understand.', url: 'martinfowler.com', metadata: 'Martin Fowler' },
]

export function getMockSearchResponse(query: string): SearchResponse {
  const normalized = query.toLowerCase()
  const isJava = normalized.includes('java') || normalized.includes('oop') || normalized.includes('object')
  return {
    query,
    resultCount: isJava ? 'About 8,420,000 results' : 'About 2,180,000 results',
    results: isJava ? results : results.map((result, index) => ({ ...result, id: `${result.id}-${index}`, title: `${query}: ${result.title}` })),
  }
}
