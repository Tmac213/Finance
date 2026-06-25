import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ArrowRightLeft, Check, ChevronsUpDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const currencyNames: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  LBP: 'Lebanese Pound',
  JPY: 'Japanese Yen',
  AED: 'United Arab Emirates Dirham',
  AFN: 'Afghan Afghani',
  ALL: 'Albanian Lek',
  AMD: 'Armenian Dram',
  ANG: 'Netherlands Antillean Guilder',
  AOA: 'Angolan Kwanza',
  ARS: 'Argentine Peso',
  AUD: 'Australian Dollar',
  AWG: 'Aruban Florin',
  AZN: 'Azerbaijani Manat',
  BAM: 'Bosnia-Herzegovina Convertible Mark',
  BBD: 'Barbadian Dollar',
  BDT: 'Bangladeshi Taka',
  BGN: 'Bulgarian Lev',
  BHD: 'Bahraini Dinar',
  BIF: 'Burundian Franc',
  BMD: 'Bermudian Dollar',
  BND: 'Brunei Dollar',
  BOB: 'Bolivian Boliviano',
  BRL: 'Brazilian Real',
  BSD: 'Bahamian Dollar',
  BTN: 'Bhutanese Ngultrum',
  BWP: 'Botswana Pula',
  BYN: 'Belarusian Ruble',
  BZD: 'Belize Dollar',
  CAD: 'Canadian Dollar',
  CDF: 'Congolese Franc',
  CHF: 'Swiss Franc',
  CLP: 'Chilean Peso',
  CNY: 'Chinese Yuan',
  COP: 'Colombian Peso',
  CRC: 'Costa Rican Colón',
  CUP: 'Cuban Peso',
  CVE: 'Cape Verdean Escudo',
  CZK: 'Czech Koruna',
  DJF: 'Djiboutian Franc',
  DKK: 'Danish Krone',
  DOP: 'Dominican Peso',
  DZD: 'Algerian Dinar',
  EGP: 'Egyptian Pound',
  ERN: 'Eritrean Nakfa',
  ETB: 'Ethiopian Birr',
  FJD: 'Fijian Dollar',
  FKP: 'Falkland Islands Pound',
  GEL: 'Georgian Lari',
  GHS: 'Ghanaian Cedi',
  GIP: 'Gibraltar Pound',
  GMD: 'Gambian Dalasi',
  GNF: 'Guinean Franc',
  GTQ: 'Guatemalan Quetzal',
  GYD: 'Guyanese Dollar',
  HKD: 'Hong Kong Dollar',
  HNL: 'Honduran Lempira',
  HRK: 'Croatian Kuna',
  HTG: 'Haitian Gourde',
  HUF: 'Hungarian Forint',
  IDR: 'Indonesian Rupiah',
  ILS: 'Israeli New Shekel',
  INR: 'Indian Rupee',
  IQD: 'Iraqi Dinar',
  IRR: 'Iranian Rial',
  ISK: 'Icelandic Króna',
  JMD: 'Jamaican Dollar',
  JOD: 'Jordanian Dinar',
  KES: 'Kenyan Shilling',
  KGS: 'Kyrgyzstani Som',
  KHR: 'Cambodian Riel',
  KMF: 'Comorian Franc',
  KPW: 'North Korean Won',
  KRW: 'South Korean Won',
  KWD: 'Kuwaiti Dinar',
  KYD: 'Cayman Islands Dollar',
  KZT: 'Kazakhstani Tenge',
  LAK: 'Lao Kip',
  LKR: 'Sri Lankan Rupee',
  LRD: 'Liberian Dollar',
  LSL: 'Lesotho Loti',
  LYD: 'Libyan Dinar',
  MAD: 'Moroccan Dirham',
  MDL: 'Moldovan Leu',
  MGA: 'Malagasy Ariary',
  MKD: 'Macedonian Denar',
  MMK: 'Myanmar Kyat',
  MNT: 'Mongolian Tögrög',
  MOP: 'Macanese Pataca',
  MRU: 'Mauritanian Ouguiya',
  MUR: 'Mauritian Rupee',
  MVR: 'Maldivian Rufiyaa',
  MWK: 'Malawian Kwacha',
  MXN: 'Mexican Peso',
  MYR: 'Malaysian Ringgit',
  MZN: 'Mozambican Metical',
  NAD: 'Namibian Dollar',
  NGN: 'Nigerian Naira',
  NIO: 'Nicaraguan Córdoba',
  NOK: 'Norwegian Krone',
  NPR: 'Nepalese Rupee',
  NZD: 'New Zealand Dollar',
  OMR: 'Omani Rial',
  PAB: 'Panamanian Balboa',
  PEN: 'Peruvian Nuevo Sol',
  PGK: 'Papua New Guinean Kina',
  PHP: 'Philippine Peso',
  PKR: 'Pakistani Rupee',
  PLN: 'Polish Złoty',
  PYG: 'Paraguayan Guaraní',
  QAR: 'Qatari Riyal',
  RON: 'Romanian Leu',
  RSD: 'Serbian Dinar',
  RUB: 'Russian Ruble',
  RWF: 'Rwandan Franc',
  SAR: 'Saudi Riyal',
  SBD: 'Solomon Islands Dollar',
  SCR: 'Seychellois Rupee',
  SDG: 'Sudanese Pound',
  SEK: 'Swedish Krona',
  SGD: 'Singapore Dollar',
  SHP: 'Saint Helena Pound',
  SLL: 'Sierra Leonean Leone',
  SOS: 'Somali Shilling',
  SRD: 'Surinamese Dollar',
  STN: 'São Tomé and Príncipe Dobra',
  SYP: 'Syrian Pound',
  SZL: 'Swazi Lilangeni',
  THB: 'Thai Baht',
  TJS: 'Tajikistani Somoni',
  TMT: 'Turkmenistani Manat',
  TND: 'Tunisian Dinar',
  TOP: 'Tongan Paʻanga',
  TRY: 'Turkish Lira',
  TTD: 'Trinidad and Tobago Dollar',
  TWD: 'New Taiwan Dollar',
  TZS: 'Tanzanian Shilling',
  UAH: 'Ukrainian Hryvnia',
  UGX: 'Ugandan Shilling',
  UYU: 'Uruguayan Peso',
  UZS: 'Uzbekistani Som',
  VES: 'Venezuelan Bolívar',
  VND: 'Vietnamese đồng',
  VUV: 'Vanuatu Vatu',
  WST: 'Samoan Tala',
  XAF: 'Central African CFA Franc',
  XCD: 'East Caribbean Dollar',
  XOF: 'West African CFA franc',
  XPF: 'CFP Franc',
  YER: 'Yemeni Rial',
  ZAR: 'South African Rand',
  ZMW: 'Zambian Kwacha',
  ZWL: 'Zimbabwean Dollar',
};

export default function CurrencyCalculator() {
  const [currencyAmount, setCurrencyAmount] = useState(100);
  const [currencyFrom, setCurrencyFrom] = useState('USD');
  const [currencyTo, setCurrencyTo] = useState('EUR');

  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  // Bullion calculator states
  const [bullionType, setBullionType] = useState('gold');
  const [bullionForm, setBullionForm] = useState('bar');
  const [bullionAmount, setBullionAmount] = useState(1);
  const [bullionUnit, setBullionUnit] = useState('oz');
  const [bullionPurity, setBullionPurity] = useState('24');
  const [bullionCurrency, setBullionCurrency] = useState('USD');
  const [openBullionType, setOpenBullionType] = useState(false);
  const [openBullionForm, setOpenBullionForm] = useState(false);
  const [openBullionUnit, setOpenBullionUnit] = useState(false);
  const [openBullionPurity, setOpenBullionPurity] = useState(false);
  const [openBullionCurrency, setOpenBullionCurrency] = useState(false);
  const [lastBullionUpdate, setLastBullionUpdate] = useState<string>('');
  const [bullionPrices, setBullionPrices] = useState<Record<string, number>>({
    gold: 2000,
    silver: 25,
    platinum: 1000,
    palladium: 1500,
  });

  // Exchange rates state
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    LBP: 89500,
    JPY: 149.5,
    // Additional currencies with placeholder rates
    AED: 3.67,
    AFN: 87.5,
    ALL: 110.0,
    AMD: 480.0,
    ANG: 1.79,
    AOA: 650.0,
    ARS: 190.0,
    AUD: 1.5,
    AWG: 1.79,
    AZN: 1.7,
    BAM: 1.95,
    BBD: 2.0,
    BDT: 105.0,
    BGN: 1.95,
    BHD: 0.38,
    BIF: 2000.0,
    BMD: 1.0,
    BND: 1.35,
    BOB: 6.9,
    BRL: 5.2,
    BSD: 1.0,
    BTN: 75.0,
    BWP: 11.0,
    BYN: 2.5,
    BZD: 2.0,
    CAD: 1.3,
    CDF: 2000.0,
    CHF: 0.92,
    CLP: 800.0,
    CNY: 6.5,
    COP: 4000.0,
    CRC: 620.0,
    CUP: 25.0,
    CVE: 100.0,
    CZK: 22.0,
    DJF: 178.0,
    DKK: 6.3,
    DOP: 56.0,
    DZD: 140.0,
    EGP: 15.7,
    ERN: 15.0,
    ETB: 55.0,
    FJD: 2.2,
    FKP: 0.75,
    GEL: 3.1,
    GHS: 12.0,
    GIP: 0.75,
    GMD: 55.0,
    GNF: 9000.0,
    GTQ: 7.8,
    GYD: 210.0,
    HKD: 7.8,
    HNL: 24.0,
    HRK: 7.0,
    HTG: 100.0,
    HUF: 350.0,
    IDR: 15000.0,
    ILS: 3.3,
    INR: 75.0,
    IQD: 1450.0,
    IRR: 42000.0,
    ISK: 130.0,
    JMD: 150.0,
    JOD: 0.71,
    KES: 110.0,
    KGS: 85.0,
    KHR: 4100.0,
    KMF: 420.0,
    KPW: 900.0,
    KRW: 1200.0,
    KWD: 0.3,
    KYD: 0.83,
    KZT: 425.0,
    LAK: 9500.0,
    LKR: 200.0,
    LRD: 150.0,
    LSL: 15.0,
    LYD: 4.5,
    MAD: 9.5,
    MDL: 18.0,
    MGA: 3800.0,
    MKD: 55.0,
    MMK: 1700.0,
    MNT: 2850.0,
    MOP: 8.0,
    MRU: 36.0,
    MUR: 40.0,
    MVR: 15.0,
    MWK: 800.0,
    MXN: 20.0,
    MYR: 4.2,
    MZN: 63.0,
    NAD: 15.0,
    NGN: 410.0,
    NIO: 35.0,
    NOK: 8.5,
    NPR: 120.0,
    NZD: 1.6,
    OMR: 0.38,
    PAB: 1.0,
    PEN: 3.8,
    PGK: 3.5,
    PHP: 50.0,
    PKR: 160.0,
    PLN: 4.2,
    PYG: 7000.0,
    QAR: 3.64,
    RON: 4.1,
    RSD: 100.0,
    RUB: 75.0,
    RWF: 1000.0,
    SAR: 3.75,
    SBD: 8.0,
    SCR: 14.0,
    SDG: 55.0,
    SEK: 9.0,
    SGD: 1.35,
    SHP: 0.75,
    SLL: 10000.0,
    SOS: 580.0,
    SRD: 14.0,
    STN: 22.0,
    SYP: 2500.0,
    SZL: 15.0,
    THB: 33.0,
    TJS: 11.0,
    TMT: 3.5,
    TND: 2.8,
    TOP: 2.3,
    TRY: 8.5,
    TTD: 6.8,
    TWD: 28.0,
    TZS: 2300.0,
    UAH: 27.0,
    UGX: 3700.0,
    UYU: 42.0,
    UZS: 10500.0,
    VES: 5.0,
    VND: 23000.0,
    VUV: 110.0,
    WST: 2.6,
    XAF: 550.0,
    XCD: 2.7,
    XOF: 550.0,
    XPF: 100.0,
    YER: 250.0,
    ZAR: 15.0,
    ZMW: 20.0,
    ZWL: 400.0,
  });

  // Array of currencies for searchable dropdowns
  const currencies = Object.entries(exchangeRates).map(([code]) => ({
    value: code,
    label: `${code} - ${currencyNames[code] || code}`,
  }));

  const convertCurrency = () => {
    const fromRate = exchangeRates[currencyFrom];
    const toRate = exchangeRates[currencyTo];
    return (currencyAmount / fromRate) * toRate;
  };

  const swapCurrencies = () => {
    setCurrencyFrom(currencyTo);
    setCurrencyTo(currencyFrom);
  };

  // Fetch exchange rates (dummy implementation, replace with real API call if needed)
  const fetchRates = async () => {
    // Simulate fetching rates from an API
    // For now, just update lastUpdate timestamp
    const now = new Date();
    setLastUpdate(now.toLocaleString());
    // In real app, fetch and update exchangeRates here
  };

  // Fetch bullion prices (dummy implementation, replace with real API call if needed)
  const fetchBullionPrices = async () => {
    // Simulate fetching bullion prices from an API
    const now = new Date();
    setLastBullionUpdate(now.toLocaleString());
    // In real app, fetch and update bullionPrices here
  };

  // Calculate bullion value based on amount, purity, price, and unit conversion
  const calculateBullionValue = () => {
    const pricePerOunce = bullionPrices[bullionType] || 0;
    const purityFactor = parseFloat(bullionPurity) / 24;
    let amountInOunces = bullionAmount;

    // Convert units to ounces if needed
    if (bullionUnit === 'g') {
      amountInOunces = bullionAmount / 31.1035;
    } else if (bullionUnit === 'kg') {
      amountInOunces = bullionAmount * 32.1507;
    }

    const valueInUSD = amountInOunces * purityFactor * pricePerOunce;

    // Convert to selected currency
    const rate = exchangeRates[bullionCurrency] || 1;
    return valueInUSD * rate;
  };

  // Bullion types, forms, units, purities arrays
  const bullionTypes = [
    { value: 'gold', label: 'Gold' },
    { value: 'silver', label: 'Silver' },
    { value: 'platinum', label: 'Platinum' },
    { value: 'palladium', label: 'Palladium' },
  ];

  const bullionForms = [
    { value: 'bar', label: 'Bar' },
    { value: 'coin', label: 'Coin' },
    { value: 'jewelry', label: 'Jewelry' },
  ];

  const bullionUnits = [
    { value: 'oz', label: 'Ounce (oz)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'kg', label: 'Kilogram (kg)' },
  ];

  const bullionPurities = [
    { value: '24', label: '24K' },
    { value: '22', label: '22K' },
    { value: '18', label: '18K' },
    { value: '14', label: '14K' },
  ];

  useEffect(() => {
    fetchRates();
    fetchBullionPrices();
    const interval = setInterval(
      () => {
        fetchRates();
        fetchBullionPrices();
      },
      5 * 60 * 1000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Currency & Bullion Calculator
        </h2>
        <p className="text-muted-foreground">
          Convert currencies and calculate bullion values
        </p>
      </div>

      <Tabs defaultValue="currency" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="currency">Currency Converter</TabsTrigger>
          <TabsTrigger value="bullion">Bullion Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="currency" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Currency Converter</CardTitle>
                  <CardDescription>
                    Convert between different currencies
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={fetchRates}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Rates
                  </Button>
                  {lastUpdate && (
                    <p className="text-sm text-muted-foreground">
                      Last updated: {lastUpdate}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from-currency">From</Label>
                  <Popover open={openFrom} onOpenChange={setOpenFrom}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openFrom}
                        className="w-full justify-between"
                      >
                        {currencyFrom
                          ? currencies.find(
                              (currency) => currency.value === currencyFrom
                            )?.label
                          : 'Select currency...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandList>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {currencies.map((currency) => (
                              <CommandItem
                                key={currency.value}
                                value={currency.value}
                                onSelect={(currentValue) => {
                                  setCurrencyFrom(
                                    currentValue === currencyFrom
                                      ? ''
                                      : currentValue
                                  );
                                  setOpenFrom(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    currencyFrom === currency.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {currency.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="number"
                    value={currencyAmount}
                    onChange={(e) =>
                      setCurrencyAmount(parseFloat(e.target.value))
                    }
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to-currency">To</Label>
                  <Popover open={openTo} onOpenChange={setOpenTo}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openTo}
                        className="w-full justify-between"
                      >
                        {currencyTo
                          ? currencies.find(
                              (currency) => currency.value === currencyTo
                            )?.label
                          : 'Select currency...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandList>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {currencies.map((currency) => (
                              <CommandItem
                                key={currency.value}
                                value={currency.value}
                                onSelect={(currentValue) => {
                                  setCurrencyTo(
                                    currentValue === currencyTo
                                      ? ''
                                      : currentValue
                                  );
                                  setOpenTo(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    currencyTo === currency.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {currency.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="p-3 border rounded-lg bg-primary/5">
                    <p className="text-lg font-bold">
                      {convertCurrency().toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currencyTo}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="outline" size="icon" onClick={swapCurrencies}>
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Exchange Rate
                </p>
                <p className="text-lg font-semibold">
                  1 {currencyFrom} ={' '}
                  {(
                    exchangeRates[currencyTo] / exchangeRates[currencyFrom]
                  ).toFixed(4)}{' '}
                  {currencyTo}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Currencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(exchangeRates).map(([currency, rate]) => (
                  <div
                    key={currency}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="font-medium">{currency}</span>
                    <span className="text-sm text-muted-foreground">
                      1 USD = {rate.toLocaleString()} {currency}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bullion" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bullion Calculator</CardTitle>
                  <CardDescription>
                    Calculate the value of precious metals
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={fetchBullionPrices}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Prices
                  </Button>
                  {lastBullionUpdate && (
                    <p className="text-sm text-muted-foreground">
                      Last updated: {lastBullionUpdate}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="bullion-type">Bullion Type</Label>
                  <Popover
                    open={openBullionType}
                    onOpenChange={setOpenBullionType}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBullionType}
                        className="w-full justify-between"
                      >
                        {bullionType
                          ? bullionTypes.find(
                              (type) => type.value === bullionType
                            )?.label
                          : 'Select bullion type...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search bullion type..." />
                        <CommandList>
                          <CommandEmpty>No bullion type found.</CommandEmpty>
                          <CommandGroup>
                            {bullionTypes.map((type) => (
                              <CommandItem
                                key={type.value}
                                value={type.value}
                                onSelect={(currentValue) => {
                                  setBullionType(
                                    currentValue === bullionType
                                      ? ''
                                      : currentValue
                                  );
                                  setOpenBullionType(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    bullionType === type.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {type.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bullion-form">Form</Label>
                  <Popover
                    open={openBullionForm}
                    onOpenChange={setOpenBullionForm}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBullionForm}
                        className="w-full justify-between"
                      >
                        {bullionForm
                          ? bullionForms.find(
                              (form) => form.value === bullionForm
                            )?.label
                          : 'Select form...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search form..." />
                        <CommandList>
                          <CommandEmpty>No form found.</CommandEmpty>
                          <CommandGroup>
                            {bullionForms.map((form) => (
                              <CommandItem
                                key={form.value}
                                value={form.value}
                                onSelect={(currentValue) => {
                                  setBullionForm(
                                    currentValue === bullionForm
                                      ? ''
                                      : currentValue
                                  );
                                  setOpenBullionForm(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    bullionForm === form.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {form.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bullion-amount">Amount</Label>
                  <Input
                    id="bullion-amount"
                    type="number"
                    step="0.01"
                    value={bullionAmount}
                    onChange={(e) =>
                      setBullionAmount(parseFloat(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bullion-unit">Unit</Label>
                  <Popover
                    open={openBullionUnit}
                    onOpenChange={setOpenBullionUnit}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBullionUnit}
                        className="w-full justify-between"
                      >
                        {bullionUnit
                          ? bullionUnits.find(
                              (unit) => unit.value === bullionUnit
                            )?.label
                          : 'Select unit...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search unit..." />
                        <CommandList>
                          <CommandEmpty>No unit found.</CommandEmpty>
                          <CommandGroup>
                            {bullionUnits.map((unit) => (
                              <CommandItem
                                key={unit.value}
                                value={unit.value}
                                onSelect={(currentValue) => {
                                  setBullionUnit(
                                    currentValue === bullionUnit
                                      ? ''
                                      : currentValue
                                  );
                                  setOpenBullionUnit(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    bullionUnit === unit.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {unit.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bullion-purity">Purity</Label>
                  <Popover
                    open={openBullionPurity}
                    onOpenChange={setOpenBullionPurity}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBullionPurity}
                        className="w-full justify-between"
                      >
                        {bullionPurity
                          ? bullionPurities.find(
                              (purity) => purity.value === bullionPurity
                            )?.label
                          : 'Select purity...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search purity..." />
                        <CommandList>
                          <CommandEmpty>No purity found.</CommandEmpty>
                          <CommandGroup>
                            {bullionPurities.map((purity) => (
                              <CommandItem
                                key={purity.value}
                                value={purity.value}
                                onSelect={(currentValue) => {
                                  setBullionPurity(
                                    currentValue === bullionPurity
                                      ? ''
                                      : currentValue
                                  );
                                  setOpenBullionPurity(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    bullionPurity === purity.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {purity.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bullion-currency">Currency</Label>
                  <Popover
                    open={openBullionCurrency}
                    onOpenChange={setOpenBullionCurrency}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBullionCurrency}
                        className="w-full justify-between"
                      >
                        {bullionCurrency
                          ? currencies.find(
                              (currency) => currency.value === bullionCurrency
                            )?.label
                          : 'Select currency...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandList>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {currencies.map((currency) => (
                              <CommandItem
                                key={currency.value}
                                value={currency.value}
                                onSelect={(currentValue) => {
                                  setBullionCurrency(
                                    currentValue === bullionCurrency
                                      ? ''
                                      : currentValue
                                  );
                                  setOpenBullionCurrency(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    bullionCurrency === currency.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {currency.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="p-6 border-2 border-primary rounded-lg bg-primary/5 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Value
                </p>
                <p className="text-4xl font-bold text-primary">
                  {bullionCurrency === 'USD' ? '$' : bullionCurrency}
                  {calculateBullionValue().toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {bullionAmount} {bullionUnit}(s) of {bullionPurity}K{' '}
                  {bullionTypes
                    .find((t) => t.value === bullionType)
                    ?.label.toLowerCase()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Bullion Prices</CardTitle>
              <CardDescription>Price per troy ounce in USD</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(bullionPrices).map(([type, price]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <span className="font-medium capitalize">{type}</span>
                    <div className="text-right">
                      <p className="text-lg font-bold">${price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">per oz</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
