import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TrendingUp,
  Coins,
  RefreshCw,
  Check,
  ChevronsUpDown,
  Trash2,
  Edit,
  Download,
  FileText,
  LineChart as ChartIcon,
  History as HistoryIcon,
} from 'lucide-react';
import { HistorySheet } from '@/components/HistorySheet';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format as formatDate } from 'date-fns';
import { exportBullionToPDF, exportBullionToExcel } from '@/lib/exportUtils';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useMemo } from 'react';
import { useFinance, BullionHoldings, BullionItem } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const BULLION_CATALOG: Record<string, Array<{ id: string; name: string; weight: number; unit: string; purity: string; metal: string; origin: string; form: 'coin' | 'bar' }>> = {
  gold: [
    { id: 'gb-sovereign', name: 'Gold Sovereign (Full)', weight: 7.98, unit: 'g', purity: '22', metal: 'gold', origin: 'British', form: 'coin' },
    { id: 'gb-half-sovereign', name: 'Gold Sovereign (Half)', weight: 3.99, unit: 'g', purity: '22', metal: 'gold', origin: 'British', form: 'coin' },
    { id: 'gb-britannia-1oz', name: 'Gold Britannia (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'gold', origin: 'British', form: 'coin' },
    { id: 'tr-ata-lira', name: 'Ata Lira (Full)', weight: 7.216, unit: 'g', purity: '22', metal: 'gold', origin: 'Turkish', form: 'coin' },
    { id: 'tr-ata-half', name: 'Ata (Half)', weight: 3.608, unit: 'g', purity: '22', metal: 'gold', origin: 'Turkish', form: 'coin' },
    { id: 'tr-ata-quarter', name: 'Ata (Quarter)', weight: 1.804, unit: 'g', purity: '22', metal: 'gold', origin: 'Turkish', form: 'coin' },
    { id: 'tr-resat-lira', name: 'Reşat Lira (Full)', weight: 7.20, unit: 'g', purity: '22', metal: 'gold', origin: 'Turkish', form: 'coin' },
    { id: 'tr-ziynet-tam', name: 'Ziynet (Full)', weight: 7.016, unit: 'g', purity: '22', metal: 'gold', origin: 'Turkish', form: 'coin' },
    { id: 'tr-ziynet-yarim', name: 'Ziynet (Half)', weight: 3.508, unit: 'g', purity: '22', metal: 'gold', origin: 'Turkish', form: 'coin' },
    { id: 'tr-ziynet-ceyrek', name: 'Ziynet (Quarter)', weight: 1.754, unit: 'g', purity: '22', metal: 'gold', origin: 'Turkish', form: 'coin' },
    { id: 'tr-gremse', name: 'Gremse Gold', weight: 17.54, unit: 'g', purity: '22', metal: 'gold', origin: 'Turkish', form: 'coin' },
    { id: 'au-krugerrand-1oz', name: 'South African Krugerrand (1 oz)', weight: 33.93, unit: 'g', purity: '22', metal: 'gold', origin: 'South African', form: 'coin' },
    { id: 'ca-maple-1oz', name: 'Canadian Maple Leaf (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'gold', origin: 'Canadian', form: 'coin' },
    { id: 'us-eagle-1oz', name: 'American Eagle (1 oz)', weight: 33.93, unit: 'g', purity: '22', metal: 'gold', origin: 'American', form: 'coin' },
    // Bars
    { id: 'gold-bar-1g', name: 'Gold Bar (1g)', weight: 1, unit: 'g', purity: '24', metal: 'gold', origin: 'Generic', form: 'bar' },
    { id: 'gold-bar-5g', name: 'Gold Bar (5g)', weight: 5, unit: 'g', purity: '24', metal: 'gold', origin: 'Generic', form: 'bar' },
    { id: 'gold-bar-10g', name: 'Gold Bar (10g)', weight: 10, unit: 'g', purity: '24', metal: 'gold', origin: 'Generic', form: 'bar' },
    { id: 'gold-bar-1oz', name: 'Gold Bar (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'gold', origin: 'Generic', form: 'bar' },
    { id: 'gold-bar-50g', name: 'Gold Bar (50g)', weight: 50, unit: 'g', purity: '24', metal: 'gold', origin: 'Generic', form: 'bar' },
    { id: 'gold-bar-100g', name: 'Gold Bar (100g)', weight: 100, unit: 'g', purity: '24', metal: 'gold', origin: 'Generic', form: 'bar' },
    { id: 'gold-bar-1kg', name: 'Gold Bar (1kg)', weight: 1000, unit: 'g', purity: '24', metal: 'gold', origin: 'Generic', form: 'bar' },
  ],
  silver: [
    { id: 'gb-britannia-1oz-sil', name: 'Silver Britannia (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'silver', origin: 'British', form: 'coin' },
    { id: 'us-eagle-1oz-sil', name: 'Silver American Eagle (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'silver', origin: 'American', form: 'coin' },
    { id: 'ca-maple-1oz-sil', name: 'Silver Maple Leaf (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'silver', origin: 'Canadian', form: 'coin' },
    // Bars
    { id: 'silver-bar-1oz', name: 'Silver Bar (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'silver', origin: 'Generic', form: 'bar' },
    { id: 'silver-bar-10oz', name: 'Silver Bar (10 oz)', weight: 311.035, unit: 'g', purity: '24', metal: 'silver', origin: 'Generic', form: 'bar' },
    { id: 'silver-bar-100oz', name: 'Silver Bar (100 oz)', weight: 3110.35, unit: 'g', purity: '24', metal: 'silver', origin: 'Generic', form: 'bar' },
    { id: 'silver-bar-1kg', name: 'Silver Bar (1kg)', weight: 1000, unit: 'g', purity: '24', metal: 'silver', origin: 'Generic', form: 'bar' },
  ],
  platinum: [
    { id: 'pt-eagle-1oz', name: 'Platinum American Eagle (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'platinum', origin: 'American', form: 'coin' },
    { id: 'pt-britannia-1oz', name: 'Platinum Britannia (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'platinum', origin: 'British', form: 'coin' },
    { id: 'platinum-bar-1oz', name: 'Platinum Bar (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'platinum', origin: 'Generic', form: 'bar' },
    { id: 'platinum-bar-10oz', name: 'Platinum Bar (10 oz)', weight: 311.035, unit: 'g', purity: '24', metal: 'platinum', origin: 'Generic', form: 'bar' },
  ],
  palladium: [
    { id: 'pd-eagle-1oz', name: 'Palladium American Eagle (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'palladium', origin: 'American', form: 'coin' },
    { id: 'palladium-bar-1oz', name: 'Palladium Bar (1 oz)', weight: 31.1, unit: 'g', purity: '24', metal: 'palladium', origin: 'Generic', form: 'bar' },
  ]
};

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

const BullionPriceGraph = ({
  history,
  exchangeRates,
  setRefreshInterval
}: {
  history: any[],
  exchangeRates: Record<string, number>,
  setRefreshInterval: (ms: number) => void
}) => {
  const [currency, setCurrency] = useState('USD');
  const [unit, setUnit] = useState('oz');
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshRate, setRefreshRate] = useState('60000');

  const filteredHistory = useMemo(() => {
    if (history.length === 0) return [];
    let cutoff = Date.now() - 3600000;
    if (timeRange === '24h') cutoff = Date.now() - 86400000;
    if (timeRange === '7d') cutoff = Date.now() - 604800000;

    let data = history.filter(p => p.timestamp >= cutoff);

    if (timeRange === '24h') {
      data = data.filter((_, idx) => idx % 15 === 0 || idx === data.length - 1);
    } else if (timeRange === '7d') {
      data = data.filter((_, idx) => idx % 60 === 0 || idx === data.length - 1);
    }

    const rate = exchangeRates[currency] || 1;
    const unitMultiplier = unit === 'oz' ? 1 : (unit === 'g' ? 1 / 31.1035 : 32.1507);

    return data.map(p => ({
      ...p,
      gold: Number((p.gold * rate * unitMultiplier).toFixed(2)),
      silver: Number((p.silver * rate * unitMultiplier).toFixed(2)),
      platinum: Number((p.platinum * rate * unitMultiplier).toFixed(2)),
      palladium: Number((p.palladium * rate * unitMultiplier).toFixed(2)),
    }));
  }, [history, currency, unit, timeRange, exchangeRates]);

  if (history.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ChartIcon className="h-5 w-5" />
            Bullion Market Analysis
          </CardTitle>
          <CardDescription>
            Live {unit.toUpperCase()} prices in {currency}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold px-1">Refresh Rate</span>
            <Select value={refreshRate} onValueChange={(v) => {
              setRefreshRate(v);
              setRefreshInterval(parseInt(v));
            }}>
              <SelectTrigger className="h-8 w-[80px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">1s</SelectItem>
                <SelectItem value="10000">10s</SelectItem>
                <SelectItem value="30000">30s</SelectItem>
                <SelectItem value="60000">1m</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold px-1">Currency</span>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-8 w-[80px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['USD', 'EUR', 'GBP', 'TRY', 'LBP', 'AED', 'SAR', 'JPY'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold px-1">Unit</span>
            <Tabs value={unit} onValueChange={setUnit} className="h-8">
              <TabsList className="h-8 p-0.5 bg-muted/50">
                <TabsTrigger value="oz" className="h-7 px-2 text-xs">oz</TabsTrigger>
                <TabsTrigger value="g" className="h-7 px-2 text-xs">g</TabsTrigger>
                <TabsTrigger value="kg" className="h-7 px-2 text-xs">kg</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold px-1">Range</span>
            <Tabs value={timeRange} onValueChange={setTimeRange} className="h-8">
              <TabsList className="h-8 p-0.5 bg-muted/50">
                <TabsTrigger value="1h" className="h-7 px-2 text-xs">1H</TabsTrigger>
                <TabsTrigger value="24h" className="h-7 px-2 text-xs">24H</TabsTrigger>
                <TabsTrigger value="7d" className="h-7 px-2 text-xs">7D</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => {
                  const date = new Date(ts);
                  return timeRange === '1h' ? formatDate(date, 'HH:mm') : formatDate(date, 'MM/dd HH:mm');
                }}
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                fontSize={11}
                domain={['auto', 'auto']}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(val) => val.toLocaleString()}
              />
              <Tooltip
                labelFormatter={(ts) => formatDate(new Date(ts), 'PPP HH:mm:ss')}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(val: number) => [val.toLocaleString(undefined, { minimumFractionDigits: 2 }), '']}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="gold"
                stroke="#EAB308"
                name="Gold"
                dot={false}
                strokeWidth={2.5}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="silver"
                stroke="#94A3B8"
                name="Silver"
                dot={false}
                strokeWidth={2.5}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="platinum"
                stroke="#60A5FA"
                name="Platinum"
                dot={false}
                strokeWidth={2.5}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="palladium"
                stroke="#F87171"
                name="Palladium"
                dot={false}
                strokeWidth={2.5}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default function BullionTracking() {
  const {
    bullionHoldings,
    updateBullionHoldings,
    bullionPrices,
    refreshBullionPrices,
    bullionHistory,
    setBullionRefreshInterval
  } = useFinance();
  const { user } = useAuth();
  const { toast } = useToast();

  // Bullion calculator states
  const [bullionType, setBullionType] = useState('gold');
  const [bullionForm, setBullionForm] = useState('bar');
  const [bullionQuantity, setBullionQuantity] = useState(1);
  const [bullionWeightPerUnit, setBullionWeightPerUnit] = useState(1);
  const [bullionUnit, setBullionUnit] = useState('oz');
  const [bullionPurity, setBullionPurity] = useState('24');
  const [bullionCurrency, setBullionCurrency] = useState('USD');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [openBullionType, setOpenBullionType] = useState(false);
  const [openBullionForm, setOpenBullionForm] = useState(false);
  const [openBullionUnit, setOpenBullionUnit] = useState(false);
  const [openBullionPurity, setOpenBullionPurity] = useState(false);
  const [openBullionCurrency, setOpenBullionCurrency] = useState(false);
  const [openCatalog, setOpenCatalog] = useState(false);


  // Current items state (all holdings in table)
  const [currentItems, setCurrentItems] = useState<
    Array<BullionItem & { saved: boolean }>
  >(() =>
    Array.isArray(bullionHoldings)
      ? bullionHoldings.map((item) => ({ ...item, saved: true }))
      : []
  );

  const [editingItem, setEditingItem] = useState<string | null>(null);

  useEffect(() => {
    setCurrentItems(
      Array.isArray(bullionHoldings)
        ? bullionHoldings.map((item) => ({ ...item, saved: true }))
        : []
    );
  }, [bullionHoldings]);

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

  // Fetch exchange rates
  const fetchRates = async () => {
    try {
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Keep existing rates on error
    }
  };

  // Calculate bullion value
  const calculateBullionValue = () => {
    const basePrice = bullionPrices[bullionType as keyof typeof bullionPrices] || 0;
    const purityMultiplier = (parseFloat(bullionPurity) || 24) / 24;
    const totalWeight = bullionQuantity * bullionWeightPerUnit;
    let convertedAmount = totalWeight;

    // Convert to ounces if needed
    if (bullionUnit === 'g') {
      convertedAmount = totalWeight / 31.1035;
    } else if (bullionUnit === 'kg') {
      convertedAmount = totalWeight * 32.1507;
    }

    const usdValue = basePrice * convertedAmount * purityMultiplier;
    const exchangeRate = exchangeRates[bullionCurrency] || 1;
    return usdValue / exchangeRate;
  };

  // Calculate pure ounces
  const calculatePureOunces = () => {
    const purityMultiplier = (parseFloat(bullionPurity) || 24) / 24;
    const totalWeight = bullionQuantity * bullionWeightPerUnit;
    let ounces = totalWeight;

    if (bullionUnit === 'g') {
      ounces = totalWeight / 31.1035;
    } else if (bullionUnit === 'kg') {
      ounces = totalWeight * 32.1507;
    }

    return ounces * purityMultiplier;
  };

  // Calculate pure ounces for given amount, unit, purity
  const calculatePureOuncesForTotalWeight = (
    totalWeight: number,
    unit: string,
    purity: string
  ) => {
    const purityMultiplier = (parseFloat(purity) || 24) / 24;
    let ounces = totalWeight;
    if (unit === 'g') {
      ounces = totalWeight / 31.1035;
    } else if (unit === 'kg') {
      ounces = totalWeight * 32.1507;
    }
    return ounces * purityMultiplier;
  };

  useEffect(() => {
    fetchRates();
  }, []);

  // Mock current prices per ounce in USD removed

  const calculateTotal = () => {
    return currentItems.reduce((total, item) => {
      const price = bullionPrices[item.type as keyof typeof bullionPrices] || 0;
      return total + item.pureOunces * price;
    }, 0);
  };

  const calculateValue = (type: string) => {
    const totalOunces = currentItems
      .filter((i) => i.type === type)
      .reduce((sum, item) => sum + item.pureOunces, 0);
    const price = bullionPrices[type as keyof typeof bullionPrices] || 0;
    return totalOunces * price;
  };

  const getAggregatedHoldings = () => {
    const aggregated: Record<string, number> = {
      gold: 0,
      silver: 0,
      platinum: 0,
      palladium: 0,
    };
    currentItems.forEach((item) => {
      aggregated[item.type] += item.pureOunces;
    });
    return aggregated;
  };

  const totalValue = calculateTotal();

  const persistHoldings = async (items: typeof currentItems) => {
    // Save all current items as holdings
    const holdings: BullionHoldings = items.map((item) => ({
      id: item.id,
      type: item.type,
      form: item.form,
      quantity: item.quantity,
      amount: item.amount,
      weightPerUnit: item.weightPerUnit,
      unit: item.unit,
      purity: item.purity,
      pureOunces: item.pureOunces,
      coinType: item.coinType,
    }));

    const result = await updateBullionHoldings(holdings);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to update holdings.',
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const newItems = currentItems.filter((item) => item.id !== id);
    setCurrentItems(newItems);
    persistHoldings(newItems);
  };

  const handleEdit = (id: string) => {
    const item = currentItems.find((item) => item.id === id);
    if (item) {
      setBullionType(item.type);
      setBullionForm(item.form);
      setBullionQuantity(item.quantity);
      setBullionWeightPerUnit(item.weightPerUnit);
      setBullionUnit(item.unit);
      setBullionPurity(item.purity);
      const catalogItem = BULLION_CATALOG[item.type]?.find(c => c.name === item.coinType);
      setSelectedCatalogId(catalogItem?.id || null);
      setEditingItem(id);
    }
  };

  const handleSaveAll = async () => {
    // Save all current items as holdings, keeping them separate
    const holdings: BullionHoldings = currentItems.map((item) => ({
      id: item.id,
      type: item.type,
      form: item.form,
      quantity: item.quantity,
      amount: item.amount,
      weightPerUnit: item.weightPerUnit,
      unit: item.unit,
      purity: item.purity,
      pureOunces: item.pureOunces,
      coinType: item.coinType,
    }));

    const result = await updateBullionHoldings(holdings);
    if (result.success) {
      toast({
        title: 'Holdings Updated',
        description: 'All items have been saved to your holdings.',
      });
      setCurrentItems((prev) => prev.map((item) => ({ ...item, saved: true })));
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to update holdings.',
      });
    }
  };

  const handleDeleteAll = () => {
    if (confirm('Are you sure you want to delete all items from the table?')) {
      setCurrentItems([]);
    }
  };

  const handleResetPortfolio = async () => {
    if (
      confirm(
        'Are you sure you want to reset the portfolio? This will delete all holdings.'
      )
    ) {
      setCurrentItems([]);
      await updateBullionHoldings([]);
      toast({
        title: 'Portfolio Reset',
        description: 'All holdings have been cleared.',
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bullion Tracking</h2>
            <p className="text-muted-foreground">
              Track your precious metal investments
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportBullionToPDF(bullionHoldings)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportBullionToExcel(bullionHoldings)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <BullionPriceGraph
            history={bullionHistory}
            exchangeRates={exchangeRates}
            setRefreshInterval={setBullionRefreshInterval}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Portfolio Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All precious metals combined
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ounces</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {currentItems
                    .reduce((sum, item) => sum + item.pureOunces, 0)
                    .toFixed(2)}{' '}
                  oz
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all metals
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Update Holdings</CardTitle>
            <CardDescription>
              Enter details to update your bullion holdings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Bullion Type */}
              <div className="space-y-2">
                <Label>Bullion Type</Label>
                <Popover open={openBullionType} onOpenChange={setOpenBullionType}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBullionType}
                      className="w-full justify-between"
                    >
                      {bullionTypes.find((type) => type.value === bullionType)
                        ?.label || 'Select type...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search bullion type..." />
                      <CommandList>
                        <CommandEmpty>No type found.</CommandEmpty>
                        <CommandGroup>
                          {bullionTypes.map((type) => (
                            <CommandItem
                              key={type.value}
                              value={type.value}
                              onSelect={(currentValue) => {
                                setBullionType(
                                  currentValue === bullionType ? '' : currentValue
                                );
                                setOpenBullionType(false);
                                setSelectedCatalogId(null);
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

              {/* Form */}
              <div className="space-y-2">
                <Label>Form</Label>
                <Popover open={openBullionForm} onOpenChange={setOpenBullionForm}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBullionForm}
                      className="w-full justify-between"
                    >
                      {bullionForms.find((form) => form.value === bullionForm)
                        ?.label || 'Select form...'}
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
                                  currentValue === bullionForm ? '' : currentValue
                                );
                                setOpenBullionForm(false);
                                setSelectedCatalogId(null);
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

              {/* Catalog - Specific Bars/Coins */}
              <div className="space-y-2">
                <Label>{bullionForm === 'coin' ? 'Coin Type' : 'Bar Size'}</Label>
                <Popover open={openCatalog} onOpenChange={setOpenCatalog}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCatalog}
                      className="w-full justify-between"
                    >
                      {selectedCatalogId
                        ? BULLION_CATALOG[bullionType]?.find(c => c.id === selectedCatalogId)?.name || `Select ${bullionForm}...`
                        : `Select ${bullionForm}...`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder={`Search ${bullionForm}...`} />
                      <CommandList>
                        <CommandEmpty>No results found for this metal/form.</CommandEmpty>
                        <CommandGroup>
                          {BULLION_CATALOG[bullionType]
                            ?.filter(item => item.form === bullionForm)
                            .map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.id}
                                onSelect={(currentValue) => {
                                  const product = BULLION_CATALOG[bullionType].find(p => p.id === currentValue);
                                  if (product) {
                                    setSelectedCatalogId(product.id);
                                    setBullionWeightPerUnit(product.weight);
                                    setBullionUnit(product.unit);
                                    setBullionPurity(product.purity);
                                  }
                                  setOpenCatalog(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedCatalogId === item.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{item.name}</span>
                                  <span className="text-xs text-muted-foreground">{item.origin} • {item.weight}{item.unit} • {item.purity}K</span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="bullion-quantity">Quantity (How many?)</Label>
                <Input
                  id="bullion-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={bullionQuantity}
                  onChange={(e) =>
                    setBullionQuantity(parseInt(e.target.value) || 0)
                  }
                />
              </div>

              {/* Weight per Unit */}
              <div className="space-y-2">
                <Label htmlFor="bullion-weight">Weight (per piece)</Label>
                <Input
                  id="bullion-weight"
                  type="number"
                  step="0.001"
                  value={bullionWeightPerUnit}
                  onChange={(e) => {
                    setBullionWeightPerUnit(parseFloat(e.target.value) || 0);
                    setSelectedCatalogId(null); // Reset catalog choice if weight is manually changed
                  }}
                />
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label>Unit</Label>
                <Popover open={openBullionUnit} onOpenChange={setOpenBullionUnit}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBullionUnit}
                      className="w-full justify-between"
                    >
                      {bullionUnits.find((unit) => unit.value === bullionUnit)
                        ?.label || 'Select unit...'}
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
                                  currentValue === bullionUnit ? '' : currentValue
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

              {/* Purity */}
              <div className="space-y-2">
                <Label>Purity</Label>
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
                      {bullionPurities.find(
                        (purity) => purity.value === bullionPurity
                      )?.label || 'Select purity...'}
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
                                setBullionPurity(currentValue);
                                setOpenBullionPurity(false);
                                setSelectedCatalogId(null);
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

              {/* Currency */}
              <div className="space-y-2">
                <Label>Currency</Label>
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
                      {bullionCurrency || 'Select currency...'}
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

            {/* Result */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calculated Value:</span>
                <span className="text-2xl font-bold">
                  {bullionCurrency} {calculateBullionValue().toFixed(2)}
                </span>

              </div>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={() => {
                refreshBullionPrices();
                fetchRates();
              }}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Prices
            </Button>
            <Button
              className="w-full"
              onClick={() => {
                let newItems = [];
                const totalWeight = bullionQuantity * bullionWeightPerUnit;
                const pureOunces = calculatePureOunces();
                const coinName = selectedCatalogId ? BULLION_CATALOG[bullionType]?.find(c => c.id === selectedCatalogId)?.name : undefined;

                if (editingItem) {
                  newItems = currentItems.map((item) =>
                    item.id === editingItem
                      ? {
                        ...item,
                        type: bullionType,
                        form: bullionForm,
                        quantity: bullionQuantity,
                        amount: totalWeight,
                        weightPerUnit: bullionWeightPerUnit,
                        unit: bullionUnit,
                        purity: bullionPurity,
                        pureOunces: pureOunces,
                        coinType: coinName,
                        saved: true,
                      }
                      : item
                  );
                  setEditingItem(null);
                } else {
                  const newItem = {
                    id: `${bullionType}-${Date.now()}`,
                    type: bullionType,
                    form: bullionForm,
                    quantity: bullionQuantity,
                    amount: totalWeight,
                    weightPerUnit: bullionWeightPerUnit,
                    unit: bullionUnit,
                    purity: bullionPurity,
                    pureOunces: pureOunces,
                    coinType: coinName,
                    saved: true,
                  };
                  newItems = [...currentItems, newItem];
                }

                setCurrentItems(newItems);
                persistHoldings(newItems);

                toast({
                  title: editingItem ? 'Item Updated' : 'Item Added',
                  description: 'Your holdings have been updated successfully.',
                });
              }}
            >
              {editingItem ? 'Update Item' : 'Add to Holdings'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Bullion Holdings</CardTitle>
              <CardDescription>Manage your bullion holdings</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDeleteAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetPortfolio}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Portfolio
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Weight/Item</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Purity</TableHead>
                  <TableHead>Pure Ounces</TableHead>
                  <TableHead>Saved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="capitalize">{item.type}</span>
                        {item.coinType && (
                          <span className="text-xs text-muted-foreground">{item.coinType}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{item.form}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.weightPerUnit}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.purity}K</TableCell>
                    <TableCell>{item.pureOunces.toFixed(4)}</TableCell>
                    <TableCell>
                      {item.saved ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Save All button removed as we now auto-save */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Breakdown</CardTitle>
            <CardDescription>
              Current value of each metal in your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(getAggregatedHoldings()).map(([type, amount]) => {
                const value = calculateValue(type);
                const percentage =
                  totalValue > 0 ? (value / totalValue) * 100 : 0;

                return (
                  <div
                    key={type}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold capitalize">{type}</p>
                        <p className="text-sm text-muted-foreground">
                          {amount.toFixed(4)} oz @ $
                          {bullionPrices[type as keyof typeof bullionPrices]}/oz
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">${value.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Market Prices</CardTitle>
            <CardDescription>
              Live precious metal prices per troy ounce (USD)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(bullionPrices).map(([type, price]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="font-medium capitalize">{type}</span>
                  <span className="text-lg font-bold">${price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spacer for fixed footer */}
        <div className="h-24"></div>

        <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-2xl">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-500/20 px-6 py-5 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              <HistoryIcon className="mr-2 h-4 w-4 text-indigo-100" />
              Audit History & Activity Logs
            </Button>
          </div>
        </footer>
      </div>

      <HistorySheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entityType="bullion-holdings"
        title="Bullion Tracking History"
      />
    </>
  );
}
