import { faker } from "@faker-js/faker";
import { MockDataConfig } from "./types";

export const DEFAULT_MOCK_CONFIG: MockDataConfig = {
  seed: 123,
  arrayLength: 3,
  skipOptional: false,
  skipOptionalProbability: 0.3,
  allowNull: true,
  nullProbability: 0.2,
  consistent: true,
  customGenerators: {},
  fieldGenerators: {
    // ID fields
    id: () => faker.string.uuid(),
    uuid: () => faker.string.uuid(),
    
    // Email fields
    email: () => faker.internet.email(),
    
    // Name fields
    name: () => faker.person.fullName(),
    firstName: () => faker.person.firstName(),
    lastName: () => faker.person.lastName(),
    fullName: () => faker.person.fullName(),
    
    // Role fields
    role: () => faker.helpers.arrayElement(["admin", "user", "viewer"]),
    
    // Status fields
    status: () => faker.helpers.arrayElement(["active", "inactive", "maintenance"]),
    
    // Date fields
    createdAt: () => faker.date.recent().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
    created: () => faker.date.recent().toISOString(),
    updated: () => faker.date.recent().toISOString(),
    
    // Organization fields
    organizationId: () => faker.string.uuid(),
    organization: () => faker.company.name(),
    
    // Asset fields
    manufacturer: () => faker.company.name(),
    model: () => faker.vehicle.model(),
    serialNumber: () => faker.string.alphanumeric(10).toUpperCase(),
    location: () => faker.location.city(),
    
    // Address fields
    address: () => faker.location.streetAddress(),
    city: () => faker.location.city(),
    state: () => faker.location.state(),
    country: () => faker.location.country(),
    zipCode: () => faker.location.zipCode(),
    
    // Phone fields
    phone: () => faker.phone.number(),
    phoneNumber: () => faker.phone.number(),
    
    // URL fields
    url: () => faker.internet.url(),
    website: () => faker.internet.url(),
    
    // Description fields
    description: () => faker.lorem.sentence(),
    bio: () => faker.lorem.paragraph(),
    
    // Price fields
    price: () => faker.commerce.price(),
    cost: () => faker.commerce.price(),
    amount: () => faker.finance.amount(),
    
    // Code fields
    code: () => faker.string.alphanumeric(8).toUpperCase(),
    reference: () => faker.string.alphanumeric(8).toUpperCase(),
  },
}; 