// Matches expense descriptions to categories by keyword.
// Keep the keyword lists lowercase; matching is case-insensitive.
//
// Matching is done on whole words (word boundaries) with an optional trailing
// "s", so "uber ride" and "uber rides" both match `ride`, while "cabbage"
// does NOT match `cab` and "workshop" does NOT match `shop`.
//
// Category order matters: the first category whose keyword matches wins.
// pets -> groceries -> utilities -> transport -> dining -> housing
//      -> entertainment -> health -> shopping

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matchesKeyword(text, keyword) {
  // \b...\b requires word boundaries; (?:s)? tolerates simple plurals.
  return new RegExp(`\\b${escapeRegExp(keyword)}(?:s)?\\b`, 'i').test(text)
}

const CATEGORIES = [
  {
    id: 'pets',
    keywords: [
      // bare 'dog'/'cat' are skipped so 'hot dog'/'cat scan' don't false-match;
      // use phrases instead
      'pet', 'vet', 'veterinarian', 'veterinary', 'grooming', 'kennel',
      'puppy', 'kitten', 'leash', 'collar',
      'dog food', 'dog walker', 'dog sitter', 'doggy daycare',
      'cat food', 'cat litter', 'cat sitter', 'pet food', 'pet store',
      'pet supplies',
    ],
  },
  {
    id: 'groceries',
    keywords: [
      // general shopping
      'grocery', 'groceries', 'grocer', 'supermarket', 'market', 'store', 'shop',
      'food', 'produce', 'pantry', 'ingredient',
      // produce
      'vegetable', 'veggie', 'fruit',
      // meat & fish
      'meat', 'butcher', 'seafood', 'fish',
      // dairy & bakery
      'dairy', 'milk', 'egg', 'cheese', 'bread', 'bakery',
      // snacks & treats
      'snack', 'candy', 'chip', 'cookie', 'dessert',
      // big chains (people often type the store name)
      'walmart', 'costco', 'target', 'whole foods', 'safeway', 'kroger',
      'aldi', 'lidl', 'loblaws', 'metro', 'trader joe', 'trader joes', 'wegmans',
      '7-eleven', 'seven eleven',
    ],
  },
  {
    id: 'utilities',
    keywords: [
      // water
      'water', 'hydro',
      // power
      'electricity', 'electric', 'power', 'heating', 'heater',
      // internet & phone
      'internet', 'wifi', 'wi-fi', 'broadband', 'cable', 'phone',
      // the bill itself
      'utility', 'utilities', 'gas bill',
    ],
  },
  {
    id: 'transport',
    keywords: [
      // general
      'transport', 'transportation', 'transit', 'commute', 'fare',
      // rideshare & taxis
      'taxi', 'cab', 'uber', 'lyft', 'ride', 'rideshare', 'ride share', 'carpool',
      // car
      'car', 'vehicle', 'van', 'truck',
      // fuel
      'gas', 'gasoline', 'fuel', 'diesel', 'petrol',
      // parking & tolls
      'parking', 'valet', 'toll',
      // public transport
      'bus', 'buses', 'train', 'metro', 'subway', 'rail', 'railway', 'tram',
      'shuttle', 'light rail',
      // air travel
      'airport', 'flight', 'plane', 'airfare',
      // rental & micro-mobility
      'car rental', 'bike', 'bicycle', 'cycling', 'bike share', 'scooter',
      // road trips
      'road trip', 'roadtrip',
    ],
  },
  {
    id: 'dining',
    keywords: [
      // meals
      'restaurant', 'cafe', 'breakfast', 'lunch', 'dinner', 'brunch', 'meal',
      // takeout & delivery
      'takeout', 'takeaway', 'take-away', 'delivery', 'doordash', 'ubereats',
      'grubhub', 'skip the dishes', 'skipthedishes', 'food truck',
      // specific foods
      'pizza', 'burger', 'sushi', 'ramen', 'noodle', 'taco', 'sandwich',
      // drinks & going out
      'coffee', 'pub', 'tip', 'bar tab', 'bar crawl',
      // common chains
      'starbucks', 'tim hortons', 'mcdonald', 'chipotle',
    ],
  },
  {
    id: 'housing',
    keywords: [
      // rent & mortgage
      'rent', 'mortgage', 'lease', 'deposit', 'condo', 'apartment', 'housing',
      'property', 'real estate',
      // travel lodging
      'accommodation', 'lodging', 'hotel', 'hostel', 'airbnb', 'resort',
    ],
  },
  {
    id: 'entertainment',
    keywords: [
      // media & streaming
      'movie', 'cinema', 'theatre', 'theater', 'netflix', 'spotify', 'disney',
      'hulu', 'streaming', 'subscription', 'show', 'concert', 'comedy',
      // gaming
      'game', 'gaming', 'steam', 'xbox', 'playstation', 'nintendo',
      // outings
      'bowling', 'arcade', 'amusement', 'aquarium', 'zoo', 'museum', 'festival',
      'karaoke', 'escape room',
      // tickets
      'ticket', 'event',
    ],
  },
  {
    id: 'health',
    keywords: [
      // medical
      'pharmacy', 'chemist', 'doctor', 'dentist', 'dental', 'hospital', 'clinic',
      'medicine', 'medication', 'meds', 'prescription', 'vaccine', 'checkup',
      'check-up', 'optometrist',
      // wellness
      'vitamin', 'supplement', 'therapy', 'therapist', 'physio', 'physiotherapy',
      'gym', 'massage', 'wellness',
    ],
  },
  {
    id: 'shopping',
    keywords: [
      // general
      'shopping', 'retail', 'mall', 'outlet', 'accessories',
      // clothing
      'clothing', 'clothes', 'shirt', 'jacket', 'jeans', 'shoes', 'sneaker',
      // beauty
      'makeup', 'cosmetics',
      // online & big-box
      'amazon', 'ikea', 'electronics', 'hardware', 'home depot', 'best buy',
    ],
  },
]

export function categoryFor(description) {
  const lower = String(description ?? '').toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((k) => matchesKeyword(lower, k))) return cat.id
  }
  return null
}
