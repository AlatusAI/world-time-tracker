import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // Needed for pipes and directives in standalone component

// Mock City Data
interface City {
  id: number;
  name: string;
  country: string;
  population: string;
  coordinates: [number, number];
  description: string;
}

const MOCK_CITIES: City[] = [
  { id: 1, name: 'Tokyo', country: 'Japan', population: '13.9M', coordinates: [35.6895, 139.6917], description: 'A vibrant global hub known for its mix of modern skyscrapers and historical temples.' },
  { id: 2, name: 'London', country: 'UK', population: '8.9M', coordinates: [51.5074, 0.1278], description: 'The capital of England, famous for its history, finance, and diverse culture.' },
  { id: 3, name: 'New York', country: 'USA', population: '8.4M', coordinates: [40.7128, -74.0060], description: 'The city that never sleeps, home to Wall Street and Broadway.' },
  { id: 4, name: 'Paris', country: 'France', population: '2.1M', coordinates: [48.8566, 2.3522], description: 'The City of Love, renowned for its art, fashion, and cuisine.' },
  { id: 5, name: 'Sydney', country: 'Australia', population: '5.3M', coordinates: [-33.8688, 151.2093], description: 'Known for the Sydney Opera House, Bondi Beach, and vibrant harbour life.' },
  { id: 6, name: 'Dubai', country: 'UAE', population: '3.1M', coordinates: [25.276987, 55.296249], description: 'A city of superlatives, home to the Burj Khalifa and large shopping malls.' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <script src="https://cdn.tailwindcss.com"></script>
    <div class="min-h-screen bg-gray-50 p-4 md:p-8 font-['Inter']">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-extrabold text-blue-800 mb-6 border-b-4 border-blue-200 pb-2">
          Global City Explorer
        </h1>

        <!-- Search Input -->
        <div class="mb-8">
          <input
            #search
            (input)="setSearchTerm(search.value)"
            type="text"
            placeholder="Search city by name or country (e.g., London, Japan)"
            class="w-full p-4 border border-gray-300 rounded-xl shadow-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-lg"
          >
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- City List Column -->
          <div class="lg:col-span-1 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            <h2 class="text-2xl font-semibold text-gray-700 mb-4 sticky top-0 bg-gray-50 z-10 p-2 -mx-2">Available Cities ({{ filteredCities().length }})</h2>

            <!-- City Cards -->
            @for (city of filteredCities(); track city.id) {
              <div
                (click)="showDetails(city)"
                class="bg-white p-5 rounded-xl shadow-lg border-l-8 cursor-pointer transition duration-200 hover:shadow-xl"
                [ngClass]="{'border-blue-500 scale-[1.01] ring-2 ring-blue-300': selectedCity()?.id === city.id, 'border-gray-200': selectedCity()?.id !== city.id}"
              >
                <div class="flex justify-between items-center">
                  <h3 class="text-xl font-bold text-gray-800">{{ city.name }}</h3>
                  <span class="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{{ city.country }}</span>
                </div>
                <p class="text-gray-500 mt-2 truncate">{{ city.description }}</p>
              </div>
            } @empty {
              <p class="text-center text-gray-500 p-8 bg-white rounded-xl shadow-lg">No cities match your search term.</p>
            }
          </div>

          <!-- City Details & Map Column -->
          <div class="lg:col-span-2">
            @if (selectedCity()) {
              <div class="bg-white p-6 rounded-xl shadow-2xl sticky top-4 border-t-8 border-blue-600">
                
                <!-- Close Button -->
                <div class="flex justify-end mb-4">
                  <button (click)="closeDetails()" class="text-gray-500 hover:text-gray-900 transition p-2 rounded-full hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <h2 class="text-3xl font-bold text-blue-700 mb-4">{{ selectedCity().name }} - Details</h2>
                
                <div class="space-y-4 mb-6 text-gray-700">
                  <p><span class="font-semibold">Country:</span> {{ selectedCity().country }}</p>
                  <p><span class="font-semibold">Population:</span> {{ selectedCity().population }}</p>
                  <p><span class="font-semibold">Description:</span> {{ selectedCity().description }}</p>
                  <p><span class="font-semibold">Coordinates:</span> {{ selectedCity().coordinates[0] }}, {{ selectedCity().coordinates[1] }}</p>
                </div>

                <!-- LLM Fact / Fun Fact Section -->
                <div class="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-inner mb-6">
                  <p class="font-semibold text-blue-700 mb-2">City Fun Fact:</p>
                  @if (isLoading()) {
                    <div class="flex items-center space-x-2 text-blue-600">
                        <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Finding a fun, current fact...</span>
                    </div>
                  } @else if (cityFact()) {
                    <p class="text-gray-800 italic">{{ cityFact() }}</p>
                  } @else {
                    <p class="text-red-500">Could not fetch a fun fact at this time.</p>
                  }
                </div>

                <!-- Map Placeholder -->
                <div class="w-full h-64 bg-gray-200 rounded-xl shadow-inner flex items-center justify-center border-4 border-dashed border-gray-400">
                    <p class="text-gray-600 text-center p-4">
                        Map View Placeholder
                        <br>
                        (A real map library like Leaflet or Google Maps would be integrated here in a full-scale app.)
                    </p>
                </div>

              </div>
            } @else {
              <div class="bg-white p-12 rounded-xl shadow-lg border-l-8 border-gray-400 text-center h-[50vh] flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.727A8 8 0 016.343 4.273L5 11h3m14-5h-3m-5 5l1 1h3m-4 0v1m-7 4h.01M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h2 class="text-xl font-semibold text-gray-500">Select a city from the list to view its details and map location.</h2>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Ensure the scrollable list is styled well */
    .max-h-\[80vh\]::-webkit-scrollbar {
      width: 8px;
    }
    .max-h-\[80vh\]::-webkit-scrollbar-thumb {
      background-color: #a7b7c9;
      border-radius: 10px;
    }
    .max-h-\[80vh\]::-webkit-scrollbar-track {
      background-color: #f1f1f1;
      border-radius: 10px;
    }
    /* Simple styling for better presentation */
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Global Firebase/App variables (MUST BE USED)
  private readonly appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  private readonly firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  private readonly initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : '';
  
  // State Signals
  cities = signal<City[]>(MOCK_CITIES);
  searchTerm = signal<string>('');
  selectedCity = signal<City | null>(null);
  cityFact = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor() {}

  // Computed Signal for Filtering
  filteredCities = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return this.cities();
    }
    return this.cities().filter(city =>
      city.name.toLowerCase().includes(term) ||
      city.country.toLowerCase().includes(term)
    );
  });

  // Event Handlers
  setSearchTerm(value: string) {
    this.searchTerm.set(value);
  }

  showDetails(city: City) {
    this.selectedCity.set(city);
    this.cityFact.set(null); // Clear previous fact
    this.fetchCityFact(city.name); // Fetch new fact
  }

  closeDetails() {
    this.selectedCity.set(null);
    this.cityFact.set(null);
  }

  // LLM API Integration for Fun Fact
  async fetchCityFact(cityName: string) {
    this.isLoading.set(true);
    
    // API endpoint and payload setup
    const systemPrompt = "Act as a friendly, enthusiastic travel blogger. Provide a concise, single-sentence fun fact about the city, starting with 'Did you know... '";
    const userQuery = `Give me one fun, current, non-historical fact about ${cityName} for a travel blog.`;
    const apiKey = ""; // Canvas environment provides the key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    // Retry logic for API calls
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error('API call failed');

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || null;
            
            if (text) {
                this.cityFact.set(text);
                break; // Success, exit loop
            }
        } catch (error) {
            console.error(`Attempt ${attempt + 1}: Error fetching city fact for ${cityName}`, error);
            if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); // Exponential backoff
            } else {
                this.cityFact.set('Failed to load a fun fact after multiple attempts.');
            }
        }
    }
    this.isLoading.set(false);
  }
}
