import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, MapPin, Calendar, CreditCard, Info } from 'lucide-react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Check if user is logged in
  const checkUserLogin = () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  };

  // Predefined responses for common queries
  const botResponses = {
    greeting: [
      "Hello! Welcome to Nepal Tourism Management System! ",
      "I'm here to help you plan your perfect trip to Nepal. What can I assist you with today?",
      "I can help you with destinations, hotels, bookings, and travel information!"
    ],
    destinations: [
      "Nepal has 7 beautiful provinces each with unique attractions:",
      " **Kathmandu Valley**: Cultural heritage sites and temples",
      " **Pokhara**: Lakes and mountains with adventure sports",
      " **Chitwan**: Wildlife and jungle safaris",
      " **Lumbini**: Birthplace of Buddha and spiritual sites",
      " **Everest Region**: World's highest peak and trekking",
      " **Annapurna Region**: Stunning mountain views and trekking trails",
      " **Langtang Region**: Beautiful valleys and traditional villages",
      "Would you like detailed information about any specific destination?"
    ],
    hotels: [
      "I can help you find the perfect accommodation! ",
      "We offer hotels, resorts, apartments, and villas across Nepal",
      "You can filter by destination, price range, and amenities",
      "Popular hotel types: Luxury resorts, Budget hotels, Heritage properties, Eco-lodges",
      "Would you like to see available hotels in a specific area?"
    ],
    booking: [
      "Booking with us is simple and secure! ",
      "1. Browse destinations and select your preferred accommodation",
      "2. Choose your dates and number of guests",
      "3. Confirm booking and receive instant confirmation",
      "4. Manage your bookings through your dashboard",
      "Need help with a specific booking? I can assist you!"
    ],
    payment: [
      "We offer secure payment options for your peace of mind! ",
      "Accepted payment methods: Credit cards, Debit cards, Digital wallets, Bank transfers",
      "All transactions are encrypted and secure",
      "Payment is processed only after booking confirmation",
      "Refund policy: Full refund 48 hours before check-in",
      "Have questions about payment? I'm here to help!"
    ],
    weather: [
      "Nepal's weather varies by region and season! ",
      "**Spring (Mar-May)**: Pleasant, 15-25°C - Best time to visit",
      "**Summer (Jun-Aug)**: Warm, 20-30°C - Mountain trekking",
      "**Autumn (Sep-Nov)**: Clear skies, 10-20°C - Peak season",
      "**Winter (Dec-Feb)**: Cold, 0-15°C - Lower regions only",
      "Monsoon season: June-September with heavy rainfall in Terai region",
      "Would you like weather info for a specific destination?"
    ],
    transport: [
      "Getting around Nepal is easy! ",
      "**Domestic flights**: Connect major cities quickly (Kathmandu, Pokhara, Bharatpur)",
      "**Tourist buses**: Comfortable and affordable intercity travel",
      "**Taxis**: Available in cities, negotiate price beforehand",
      "**Rental cars**: Available in major cities with driver",
      "**Motorbikes**: Popular for adventurous travelers",
      "**Micro-buses**: Local transport within cities",
      "Need transport advice for your itinerary?"
    ],
    activities: [
      "Nepal offers amazing activities for every traveler! ",
      "**Trekking**: Everest, Annapurna, Langtang, Manaslu regions",
      "**Cultural tours**: Temples, monasteries, heritage sites, Durbar squares",
      "**Adventure sports**: Paragliding in Pokhara, Rafting in Trishuli, Bungee jumping",
      "**Wildlife safari**: Chitwan National Park elephant rides, Bardia National Park",
      "**Spiritual retreats**: Meditation and yoga centers in Kathmandu and Pokhara",
      "**Mountain flights**: Everest experience flight, helicopter tours",
      "**Photography tours**: Capture Himalayan beauty and cultural heritage",
      "What type of activities interest you most?"
    ],
    culture: [
      "Nepal has rich cultural diversity! ",
      "**Religions**: Hinduism (81%), Buddhism (9%), Islam, Christianity, others",
      "**Languages**: Nepali (official), Maithili, Bhojpuri, Newari, Tamang, Gurung",
      "**Festivals**: Dashain, Tihar (Diwali), Holi, Teej, Buddha Jayanti",
      "**Cuisine**: Dal bhat (lentil soup with rice), Momos, Thukpa, Sel roti",
      "**Traditional dress**: Daura-Suruwal for men, Sari-Cholo for women",
      "**Art and architecture**: Pagoda-style temples, Thangka paintings, Wood carvings"
    ],
    festivals: [
      "Nepal celebrates vibrant festivals throughout the year! ",
      "**Dashain (Oct)**: Biggest Hindu festival, 15 days celebration",
      "**Tihar/Diwali (Nov)**: Festival of lights, 5 days celebration",
      "**Holi (Mar)**: Festival of colors, spring celebration",
      "**Teej (Aug/Sep)**: Women's festival for marital happiness",
      "**Buddha Jayanti (May)**: Buddha's birth celebration",
      "**Indra Jatra (Sep)**: Kathmandu's biggest street festival",
      "**Losar (Feb/Mar)**: Tibetan New Year celebration"
    ],
    food: [
      "Nepali cuisine is diverse and delicious! ",
      "**Main dishes**: Dal bhat (lentil soup with rice), Momos (dumplings), Thukpa (noodle soup)",
      "**Snacks**: Sel roti, Samosa, Chatamari, Bara",
      "**Beverages**: Chiya (tea), Raksi (local alcohol), Lassi",
      "**Regional specialties**: Newari cuisine (Kwati, Yomari), Thakali food",
      "**Street food**: Sekuwa, Chatpate, Pani puri, Samosa",
      "**Desserts**: Kheer, Lalmohan, Malpuwa"
    ],
    shopping: [
      "Shopping in Nepal offers unique treasures! ",
      "**Handicrafts**: Pashmina shawls, Thangka paintings, Wood carvings",
      "**Jewelry**: Silver jewelry, Beaded necklaces, Traditional ornaments",
      "**Textiles**: Dhaka fabric, Handwoven carpets, Pashmina products",
      "**Souvenirs**: Prayer flags, Singing bowls, Masks, Statues",
      "**Shopping areas**: Thamel (Kathmandu), Lakeside (Pokhara), Patan Durbar Square",
      "**Traditional markets**: Asan Bazaar, Indra Chowk, New Road"
    ],
    safety: [
      "Your safety is our priority! ",
      "**General safety**: Nepal is generally safe for tourists",
      "**Altitude sickness**: Acclimatize properly, carry Diamox tablets",
      "**Water safety**: Drink bottled or boiled water only",
      "**Transport safety**: Use registered taxis, avoid night travel in remote areas",
      "**Health**: Travel insurance recommended, carry basic medications",
      "**Emergency numbers**: Police (100), Ambulance (102), Tourist Police (1147)",
      "**Documents**: Keep photocopies of passport and visa"
    ],
    visa: [
      "Visa information for Nepal! ",
      "**Tourist visa**: Available on arrival for most countries",
      "**Duration**: 15, 30, or 90 days visa options",
      "**Requirements**: Valid passport (6 months), Passport photos, Visa fee",
      "**Visa on arrival**: Available at Tribhuvan International Airport",
      "**Extension**: Can extend visa up to 150 days total",
      "**Free visa**: SAARC countries (except Afghanistan) get free visa",
      "**Online application**: Recommended for faster processing"
    ],
    currency: [
      "Currency information for Nepal! ",
      "**Official currency**: Nepalese Rupee (NPR)",
      "**Exchange rate**: Approximately 1 USD = 132 NPR (varies)",
      "**Currency exchange**: Available at airports, banks, authorized money changers",
      "**ATMs**: Widely available in cities, limited in rural areas",
      "**Credit cards**: Accepted in hotels and major stores, cash preferred",
      "**Tipping**: Not mandatory but appreciated for good service",
      "**Budget**: Daily budget $20-50 for budget travelers, $50-100+ for comfort"
    ],
    bestTime: [
      "Best time to visit Nepal! ",
      "**Spring (March-May)**: Best overall, flowers blooming, clear skies",
      "**Autumn (September-November)**: Peak season, perfect weather, festivals",
      "**Winter (December-February)**: Good for lowland trekking, cold in mountains",
      "**Summer (June-August)**: Monsoon season, good for Upper Mustang and Dolpo",
      "**Shoulder seasons**: Fewer crowds, better prices",
      "**Festival times**: Dashain (Oct), Tihar (Nov) for cultural experience"
    ],
    help: [
      "I'm here to help with your Nepal travel needs! ",
      "You can ask me about:",
      "• Destinations and attractions",
      "• Hotels and accommodations", 
      "• Booking and reservations",
      "• Payment and pricing",
      "• Weather and best time to visit",
      "• Transportation options",
      "• Activities and tours",
      "• Culture and festivals",
      "• Food and cuisine",
      "• Shopping and souvenirs",
      "• Safety and health",
      "• Visa and currency",
      "• Travel tips and advice",
      "Type your question or choose from quick options below!"
    ]
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for custom event from navbar
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener('openChatbot', handleOpenChatbot);
    
    return () => {
      window.removeEventListener('openChatbot', handleOpenChatbot);
    };
  }, []);

  // Get bot response based on user input
  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    const isLoggedIn = checkUserLogin();
    
    // Check for specific keywords and return appropriate response
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return botResponses.greeting;
    } else if (lowerMessage.includes('destination') || lowerMessage.includes('place') || lowerMessage.includes('where')) {
      return botResponses.destinations;
    } else if (lowerMessage.includes('hotel') || lowerMessage.includes('accommodation') || lowerMessage.includes('stay')) {
      return botResponses.hotels;
    } else if (lowerMessage.includes('book') || lowerMessage.includes('reservation')) {
      return botResponses.booking;
    } else if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('price')) {
      return botResponses.payment;
    } else if (lowerMessage.includes('weather') || lowerMessage.includes('climate') || lowerMessage.includes('season')) {
      return botResponses.weather;
    } else if (lowerMessage.includes('transport') || lowerMessage.includes('travel') || lowerMessage.includes('get around')) {
      return botResponses.transport;
    } else if (lowerMessage.includes('activity') || lowerMessage.includes('do') || lowerMessage.includes('fun')) {
      return botResponses.activities;
    } else if (lowerMessage.includes('culture') || lowerMessage.includes('tradition') || lowerMessage.includes('custom')) {
      return isLoggedIn ? botResponses.culture : ["Please login to learn about Nepali culture and traditions."];
    } else if (lowerMessage.includes('festival') || lowerMessage.includes('celebration') || lowerMessage.includes('dashain') || lowerMessage.includes('tihar')) {
      return isLoggedIn ? botResponses.festivals : ["Please login to learn about Nepali festivals and celebrations."];
    } else if (lowerMessage.includes('food') || lowerMessage.includes('cuisine') || lowerMessage.includes('eat') || lowerMessage.includes('momo')) {
      return isLoggedIn ? botResponses.food : ["Please login to learn about Nepali cuisine and food culture."];
    } else if (lowerMessage.includes('shop') || lowerMessage.includes('buy') || lowerMessage.includes('souvenir') || lowerMessage.includes('pashmina')) {
      return isLoggedIn ? botResponses.shopping : ["Please login to learn about shopping and souvenirs in Nepal."];
    } else if (lowerMessage.includes('safe') || lowerMessage.includes('danger') || lowerMessage.includes('emergency') || lowerMessage.includes('health')) {
      return isLoggedIn ? botResponses.safety : ["Please login to learn about safety tips and health information."];
    } else if (lowerMessage.includes('visa') || lowerMessage.includes('passport') || lowerMessage.includes('immigration')) {
      return isLoggedIn ? botResponses.visa : ["Please login to learn about visa requirements and immigration."];
    } else if (lowerMessage.includes('currency') || lowerMessage.includes('money') || lowerMessage.includes('exchange') || lowerMessage.includes('npr')) {
      return isLoggedIn ? botResponses.currency : ["Please login to learn about currency and exchange rates."];
    } else if (lowerMessage.includes('best time') || lowerMessage.includes('when') || lowerMessage.includes('season')) {
      return isLoggedIn ? botResponses.bestTime : ["Please login to learn about the best time to visit Nepal."];
    } else if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('support')) {
      return botResponses.help;
    } else {
      return [
        "I'm not sure I understand. Could you rephrase your question?",
        "You can ask me about destinations, hotels, bookings, weather, transport, or activities!",
        isLoggedIn ? "Or ask about culture, festivals, food, shopping, safety, visa, currency, or best time to visit." : "Login to access more detailed information about Nepal's culture, festivals, food, shopping, safety, visa, currency, and best travel times.",
        "Type 'help' to see all available topics."
      ];
    }
  };

  // Handle sending message
  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);

    // Clear input
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot typing and response
    setTimeout(() => {
      const botResponseArray = getBotResponse(inputMessage);
      const botMsg = {
        id: Date.now() + 1,
        text: botResponseArray.join('\n\n'),
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  // Handle quick action buttons
  const handleQuickAction = (topic) => {
    const quickMsg = {
      id: Date.now(),
      text: `Tell me about ${topic}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, quickMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const responseArray = getBotResponse(topic);
      const botMsg = {
        id: Date.now() + 1,
        text: responseArray.join('\n\n'),
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-20 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:scale-110 transition-all duration-300"
            size="lg"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              1
            </span>
          </Button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-20 right-6 z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-12' : 'w-96 h-[600px]'
        }`}>
          <Card className="h-full shadow-2xl border-2 border-blue-200">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <CardTitle className="text-sm font-semibold">Nepal Tourism Assistant</CardTitle>
                {checkUserLogin() ? (
                  <Badge variant="secondary" className="ml-2 bg-green-500 text-white text-xs">Logged In</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2 bg-orange-500 text-white text-xs">Guest</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 p-1"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <CardContent className="h-[400px] overflow-y-auto p-4 bg-gray-50">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600 text-sm">Hello! 👋 I'm your Nepal Tourism Assistant</p>
                      <p className="text-gray-500 text-xs mt-2">How can I help you plan your trip today?</p>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {message.sender === 'bot' ? (
                            <Bot className="h-3 w-3 text-blue-600" />
                          ) : (
                            <User className="h-3 w-3 text-blue-600" />
                          )}
                          <span className="text-xs opacity-60">{message.timestamp}</span>
                        </div>
                        <div className="text-sm whitespace-pre-line">{message.text}</div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Bot className="h-3 w-3 text-blue-600" />
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Quick Actions */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('destinations')}
                      className="text-xs h-8 flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      Destinations
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('hotels')}
                      className="text-xs h-8 flex items-center gap-1"
                    >
                      <Info className="h-3 w-3" />
                      Hotels
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('booking')}
                      className="text-xs h-8 flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3" />
                      Booking
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('payment')}
                      className="text-xs h-8 flex items-center gap-1"
                    >
                      <CreditCard className="h-3 w-3" />
                      Payment
                    </Button>
                    {checkUserLogin() && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction('culture')}
                          className="text-xs h-8 flex items-center gap-1"
                        >
                          🏛️ Culture
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction('food')}
                          className="text-xs h-8 flex items-center gap-1"
                        >
                          🍜 Food
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction('shopping')}
                          className="text-xs h-8 flex items-center gap-1"
                        >
                          🛍️ Shopping
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction('safety')}
                          className="text-xs h-8 flex items-center gap-1"
                        >
                          🛡️ Safety
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about Nepal travel..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={inputMessage.trim() === '' || isTyping}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default Chatbot;
