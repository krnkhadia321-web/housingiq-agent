import 'dotenv/config'
import { tavily } from '@tavily/core';

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

// --- Tool 1: Calculate true monthly cost ---
export function calculateTrueCost({
  monthlyRent,
  utilitiesEstimate,
  monthlyCommuteCost,
  miscExpenses,
  currency = 'USD',
  currencySymbol = '$',
}: {
  monthlyRent: number;
  utilitiesEstimate: number;
  monthlyCommuteCost: number;
  miscExpenses: number;
  currency?: string;
  currencySymbol?: string;
}) {
  const total = monthlyRent + utilitiesEstimate + monthlyCommuteCost + miscExpenses;
  const annual = total * 12;
  const breakdown = {
    rent: monthlyRent,
    utilities: utilitiesEstimate,
    commute: monthlyCommuteCost,
    misc: miscExpenses,
    totalMonthly: total,
    totalAnnual: annual,
    rentPercentage: Math.round((monthlyRent / total) * 100),
    currency,
    currencySymbol,
  };
  return JSON.stringify(breakdown);
}

// --- Tool 2: Compare two cities ---
export function compareCities({
  city1, rent1, utilities1, commute1,
  city2, rent2, utilities2, commute2,
  currency = 'USD',
  currencySymbol = '$',
}: {
  city1: string; rent1: number; utilities1: number; commute1: number;
  city2: string; rent2: number; utilities2: number; commute2: number;
  currency?: string;
  currencySymbol?: string;
}) {
  const total1 = rent1 + utilities1 + commute1;
  const total2 = rent2 + utilities2 + commute2;
  const cheaper = total1 < total2 ? city1 : city2;
  const difference = Math.abs(total1 - total2);
  const percentageDiff = Math.round((difference / Math.max(total1, total2)) * 100);

  return JSON.stringify({
    city1: { name: city1, rent: rent1, utilities: utilities1, commute: commute1, total: total1 },
    city2: { name: city2, rent: rent2, utilities: utilities2, commute: commute2, total: total2 },
    cheaper,
    monthlySaving: difference,
    annualSaving: difference * 12,
    percentageDiff,
    currency,
    currencySymbol,
  });
}

// --- Tool 3: Generate moving checklist ---
export function generateMovingChecklist({ city, moveInDate }: { city: string; moveInDate: string }) {
  const checklist = {
    city,
    moveInDate,
    beforeMoving: [
      'Research neighborhoods and commute routes',
      'Set a total monthly budget (rent + utilities + commute)',
      'Get rental agreements reviewed before signing',
      'Check if utilities are included in rent',
      'Confirm deposit amount and refund terms',
      'Research local tenant rights',
    ],
    firstWeek: [
      'Document any existing damage with photos',
      'Set up electricity, water, and internet accounts',
      'Update your address with bank and government',
      'Find nearest grocery stores, hospitals, and pharmacies',
      'Meet your neighbors and building management',
    ],
    firstMonth: [
      'Set up automatic rent payment',
      'Track actual utility costs vs estimate',
      'Explore the neighborhood on foot',
      'Join local community groups online',
      'Review lease terms and renewal dates',
    ],
  };
  return JSON.stringify(checklist);
}

// --- Tool 4: Search rental market data ---
export async function searchRentalData({ query, location }: { query: string; location: string }): Promise<string>{
  try {
    const result = await tavilyClient.search(query, {
      searchDepth: 'basic',
      maxResults: 5,
    });

    const summaries = result.results.map((r: any) => ({
      title: r.title,
      content: r.content?.slice(0, 300),
      url: r.url,
    }));

    return JSON.stringify({ query, results: summaries });
  } catch (err: any) {
    return JSON.stringify({ error: 'Search failed', message: err.message });
  }
}
// --- Tool 5: Save a property ---
export async function saveProperty({
  city,
  neighborhood,
  monthlyRent,
  notes,
  userId,
}: {
  city: string;
  neighborhood: string;
  monthlyRent: number | string;
  notes: string;
  userId: string;
}): Promise<string> {
  monthlyRent = Number(monthlyRent);
  try {
    const { getDB } = await import('./db.js');
    const db = getDB();
    const property = {
      city,
      neighborhood,
      monthlyRent,
      notes,
      userId,
      savedAt: new Date(),
    };
    await db.collection('properties').insertOne(property);
    return JSON.stringify({ success: true, message: `Property in ${neighborhood}, ${city} saved successfully.`, property });
  } catch (err: any) {
    return JSON.stringify({ success: false, error: err.message });
  }
}

// --- Tool 6: Get saved properties ---
export async function getSavedProperties({ userId, confirm, filter }: { userId: string; confirm: string; filter?: string }): Promise<string> {
  try {
    const { getDB } = await import('./db.js');
    const db = getDB();
    const properties = await db.collection('properties').find({ userId }).toArray();
    if (properties.length === 0) return JSON.stringify({ message: 'No saved properties found.', properties: [] });
    return JSON.stringify({ count: properties.length, properties });
  } catch (err: any) {
    return JSON.stringify({ error: err.message });
  }
}

// --- Tool 7: Delete a saved property ---
export async function deleteProperty({
  neighborhood,
  city,
  userId,
}: {
  neighborhood: string;
  city: string;
  userId: string;
}): Promise<string> {
  try {
    const { getDB } = await import('./db.js');
    const db = getDB();
    const result = await db.collection('properties').deleteOne({ neighborhood, city, userId });
    if (result.deletedCount === 0) {
      return JSON.stringify({ success: false, message: `No property found in ${neighborhood}, ${city}.` });
    }
    return JSON.stringify({ success: true, message: `Property in ${neighborhood}, ${city} deleted successfully.` });
  } catch (err: any) {
    return JSON.stringify({ success: false, error: err.message });
  }
}

// --- Tool 8: Compare two saved properties ---
export async function compareSavedProperties({
  neighborhood1,
  city1,
  neighborhood2,
  city2,
  userId,
}: {
  neighborhood1: string;
  city1: string;
  neighborhood2: string;
  city2: string;
  userId: string;
}): Promise<string> {
  try {
    const { getDB } = await import('./db.js');
    const db = getDB();
    const p1 = await db.collection('properties').findOne({ neighborhood: neighborhood1, city: city1, userId });
    const p2 = await db.collection('properties').findOne({ neighborhood: neighborhood2, city: city2, userId });
    if (!p1 || !p2) {
      return JSON.stringify({ success: false, message: 'One or both properties not found in saved list.' });
    }
    const cheaper = p1.monthlyRent < p2.monthlyRent
      ? `${p1.neighborhood}, ${p1.city}`
      : `${p2.neighborhood}, ${p2.city}`;
    const difference = Math.abs(p1.monthlyRent - p2.monthlyRent);
    return JSON.stringify({
      success: true,
      property1: p1,
      property2: p2,
      cheaper,
      monthlySaving: difference,
      annualSaving: difference * 12,
    });
  } catch (err: any) {
    return JSON.stringify({ success: false, error: err.message });
  }
}

// --- Tool definitions for Groq ---
export const toolDefinitions = [
{
  type: 'function' as const,
  function: {
    name: 'calculateTrueCost',
    description: 'Calculate the true total monthly and annual cost of living somewhere including rent, utilities, commute and misc expenses.',
    parameters: {
      type: 'object',
      properties: {
        monthlyRent:        { type: 'number', description: 'Monthly rent in local currency' },
        utilitiesEstimate:  { type: 'number', description: 'Monthly utilities estimate in local currency' },
        monthlyCommuteCost: { type: 'number', description: 'Monthly commute cost in local currency' },
        miscExpenses:       { type: 'number', description: 'Other monthly expenses in local currency' },
        currency:           { type: 'string', description: 'Currency code e.g. USD, INR, EUR, GBP, JPY' },
        currencySymbol:     { type: 'string', description: 'Currency symbol e.g. $, ₹, €, £, ¥' },
      },
      required: ['monthlyRent', 'utilitiesEstimate', 'monthlyCommuteCost', 'miscExpenses', 'currency', 'currencySymbol']
    }
  }
},
  {
  type: 'function' as const,
  function: {
    name: 'compareCities',
    description: 'Compare housing costs between two cities side by side.',
    parameters: {
      type: 'object',
      properties: {
        city1:          { type: 'string', description: 'First city name' },
        rent1:          { type: 'number', description: 'Monthly rent in city 1' },
        utilities1:     { type: 'number', description: 'Monthly utilities in city 1' },
        commute1:       { type: 'number', description: 'Monthly commute cost in city 1' },
        city2:          { type: 'string', description: 'Second city name' },
        rent2:          { type: 'number', description: 'Monthly rent in city 2' },
        utilities2:     { type: 'number', description: 'Monthly utilities in city 2' },
        commute2:       { type: 'number', description: 'Monthly commute cost in city 2' },
        currencySymbol: { type: 'string', description: 'Currency symbol e.g. $, ₹, €, £, ¥' },
        currency:       { type: 'string', description: 'Currency code e.g. USD, INR, EUR' },
      },
      required: ['city1', 'rent1', 'utilities1', 'commute1', 'city2', 'rent2', 'utilities2', 'commute2', 'currencySymbol', 'currency']
    }
  }
},
  {
    type: 'function' as const,
    function: {
      name: 'generateMovingChecklist',
      description: 'Generate a moving checklist tailored to a specific city and move-in date.',
      parameters: {
        type: 'object',
        properties: {
          city:       { type: 'string', description: 'The city the user is moving to' },
          moveInDate: { type: 'string', description: 'Expected move-in date' },
        },
        required: ['city', 'moveInDate']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'searchRentalData',
      description: 'Search the web for current rental prices, housing market data, and cost of living information for any city.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query e.g. "average rent 1 bedroom apartment London 2026"' },
          location: { type: 'string', description: 'The city or location being searched' }
        },
        required: ['query', 'location']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'saveProperty',
      description: 'Save a property or city the user is interested in to their list.',
      parameters: {
        type: 'object',
        properties: {
          city:          { type: 'string',  description: 'City name' },
          neighborhood:  { type: 'string',  description: 'Neighborhood or area name' },
          monthlyRent:   { type: 'number',  description: 'Monthly rent in USD' },
          notes:         { type: 'string',  description: 'Any notes about this property' },
          userId:        { type: 'string',  description: 'User identifier, use "default" if not provided' },
        },
        required: ['city', 'neighborhood', 'monthlyRent', 'notes', 'userId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'getSavedProperties',
      description: 'Get all properties the user has saved.',
      parameters: {
  type: 'object',
  properties: {
    userId:  { type: 'string', description: 'User identifier, use "default" if not provided' },
    confirm: { type: 'string', description: 'Set to "yes" to confirm retrieval' },
    filter:  { type: 'string', description: 'Optional filter, use "all" to retrieve all properties' },
  },
    required: ['userId', 'confirm', 'filter']
}
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'deleteProperty',
      description: 'Delete a saved property from the user list by neighborhood and city.',
      parameters: {
        type: 'object',
        properties: {
          neighborhood: { type: 'string', description: 'Neighborhood name' },
          city:         { type: 'string', description: 'City name' },
          userId:       { type: 'string', description: 'User identifier, use "default" if not provided' },
        },
        required: ['neighborhood', 'city', 'userId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'compareSavedProperties',
      description: 'Compare two properties the user has already saved.',
      parameters: {
        type: 'object',
        properties: {
          neighborhood1: { type: 'string', description: 'Neighborhood of first property' },
          city1:         { type: 'string', description: 'City of first property' },
          neighborhood2: { type: 'string', description: 'Neighborhood of second property' },
          city2:         { type: 'string', description: 'City of second property' },
          userId:        { type: 'string', description: 'User identifier, use "default" if not provided' },
        },
        required: ['neighborhood1', 'city1', 'neighborhood2', 'city2', 'userId']
      }
    }
  },
];

// --- Tool runner ---
export async function runTool(name: string, args: Record<string, any>): Promise<string> {
  if (name === 'calculateTrueCost') return calculateTrueCost(args as any);
  if (name === 'compareCities') return compareCities(args as any);
  if (name === 'generateMovingChecklist') return generateMovingChecklist(args as any);
  if (name === 'searchRentalData') return await searchRentalData(args as any);
  if (name === 'saveProperty') return await saveProperty(args as any);
  if (name === 'getSavedProperties') return await getSavedProperties(args as any);
  if (name === 'deleteProperty') return await deleteProperty(args as any);
  if (name === 'compareSavedProperties') return await compareSavedProperties(args as any);
  return 'Unknown tool';
}