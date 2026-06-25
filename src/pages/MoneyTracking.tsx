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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Euro,
  Coins,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  AlertTriangle,
  PlusCircle,
  Trash2,
  CheckCircle,
  History as HistoryIcon,
} from 'lucide-react';
import { HistorySheet } from '@/components/HistorySheet';
import { useToast } from '@/hooks/use-toast';
import { useFinance } from '@/contexts/FinanceContext';

const commonCurrencies = [
  // === AMERICAS ===
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    denominations: [100, 50, 20, 10, 5, 2, 1],
    exchangeRateToUsd: 1,
  },
  {
    code: 'ARS',
    name: 'Argentine Peso',
    symbol: '$',
    denominations: [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.0011,
  },
  {
    code: 'BBD',
    name: 'Barbadian Dollar',
    symbol: '$',
    denominations: [100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 0.50,
  },
  {
    code: 'BMD',
    name: 'Bermudian Dollar',
    symbol: '$',
    denominations: [100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 1,
  },
  {
    code: 'BOB',
    name: 'Bolivian Boliviano',
    symbol: 'Bs.',
    denominations: [200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.14,
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    denominations: [200, 100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 0.20,
  },
  {
    code: 'BSD',
    name: 'Bahamian Dollar',
    symbol: '$',
    denominations: [100, 50, 20, 10, 5, 3, 1],
    exchangeRateToUsd: 1,
  },
  {
    code: 'BZD',
    name: 'Belize Dollar',
    symbol: 'BZ$',
    denominations: [100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 0.50,
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    denominations: [100, 50, 20, 10, 5, 2, 1],
    exchangeRateToUsd: 0.74,
  },
  {
    code: 'CLP',
    name: 'Chilean Peso',
    symbol: '$',
    denominations: [20000, 10000, 5000, 2000, 1000],
    exchangeRateToUsd: 0.0011,
  },
  {
    code: 'COP',
    name: 'Colombian Peso',
    symbol: '$',
    denominations: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
    exchangeRateToUsd: 0.00025,
  },
  {
    code: 'CRC',
    name: 'Costa Rican Colón',
    symbol: '₡',
    denominations: [50000, 20000, 10000, 5000, 2000, 1000],
    exchangeRateToUsd: 0.0019,
  },
  {
    code: 'CUP',
    name: 'Cuban Peso',
    symbol: '₱',
    denominations: [100, 50, 20, 10, 5, 3, 1],
    exchangeRateToUsd: 0.042,
  },
  {
    code: 'DOP',
    name: 'Dominican Peso',
    symbol: 'RD$',
    denominations: [2000, 1000, 500, 200, 100, 50, 20],
    exchangeRateToUsd: 0.018,
  },
  {
    code: 'GTQ',
    name: 'Guatemalan Quetzal',
    symbol: 'Q',
    denominations: [200, 100, 50, 20, 10, 5, 1],
    exchangeRateToUsd: 0.13,
  },
  {
    code: 'GYD',
    name: 'Guyanese Dollar',
    symbol: '$',
    denominations: [5000, 1000, 500, 100, 50, 20],
    exchangeRateToUsd: 0.0048,
  },
  {
    code: 'HNL',
    name: 'Honduran Lempira',
    symbol: 'L',
    denominations: [500, 100, 50, 20, 10, 5, 1],
    exchangeRateToUsd: 0.040,
  },
  {
    code: 'HTG',
    name: 'Haitian Gourde',
    symbol: 'G',
    denominations: [1000, 500, 250, 100, 50, 25, 10],
    exchangeRateToUsd: 0.0076,
  },
  {
    code: 'JMD',
    name: 'Jamaican Dollar',
    symbol: 'J$',
    denominations: [5000, 1000, 500, 100, 50],
    exchangeRateToUsd: 0.0064,
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    denominations: [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1],
    exchangeRateToUsd: 0.060,
  },
  {
    code: 'NIO',
    name: 'Nicaraguan Córdoba',
    symbol: 'C$',
    denominations: [500, 200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.027,
  },
  {
    code: 'PAB',
    name: 'Panamanian Balboa',
    symbol: 'B/.',
    denominations: [100, 50, 20, 10, 5, 1],
    exchangeRateToUsd: 1,
  },
  {
    code: 'PEN',
    name: 'Peruvian Sol',
    symbol: 'S/',
    denominations: [200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.27,
  },
  {
    code: 'PYG',
    name: 'Paraguayan Guaraní',
    symbol: '₲',
    denominations: [100000, 50000, 20000, 10000, 5000, 2000],
    exchangeRateToUsd: 0.00013,
  },
  {
    code: 'SRD',
    name: 'Surinamese Dollar',
    symbol: '$',
    denominations: [100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.035,
  },
  {
    code: 'TTD',
    name: 'Trinidad and Tobago Dollar',
    symbol: 'TT$',
    denominations: [100, 50, 20, 10, 5, 1],
    exchangeRateToUsd: 0.15,
  },
  {
    code: 'UYU',
    name: 'Uruguayan Peso',
    symbol: '$U',
    denominations: [2000, 1000, 500, 200, 100, 50],
    exchangeRateToUsd: 0.025,
  },
  {
    code: 'VES',
    name: 'Venezuelan Bolívar',
    symbol: 'Bs.S',
    denominations: [100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.028,
  },

  // === EUROPE ===
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    denominations: [500, 200, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 1.09,
  },
  {
    code: 'ALL',
    name: 'Albanian Lek',
    symbol: 'L',
    denominations: [10000, 5000, 2000, 1000, 500, 200],
    exchangeRateToUsd: 0.010,
  },
  {
    code: 'BAM',
    name: 'Bosnia-Herzegovina Mark',
    symbol: 'KM',
    denominations: [200, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.54,
  },
  {
    code: 'BGN',
    name: 'Bulgarian Lev',
    symbol: 'лв',
    denominations: [100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 0.54,
  },
  {
    code: 'BYN',
    name: 'Belarusian Ruble',
    symbol: 'Br',
    denominations: [500, 200, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.31,
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    denominations: [1000, 200, 100, 50, 20, 10],
    exchangeRateToUsd: 1.13,
  },
  {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    denominations: [5000, 2000, 1000, 500, 200, 100],
    exchangeRateToUsd: 0.044,
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    denominations: [1000, 500, 200, 100, 50],
    exchangeRateToUsd: 0.14,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    denominations: [50, 20, 10, 5],
    exchangeRateToUsd: 1.27,
  },
  {
    code: 'GEL',
    name: 'Georgian Lari',
    symbol: '₾',
    denominations: [200, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.37,
  },
  {
    code: 'HRK',
    name: 'Croatian Kuna',
    symbol: 'kn',
    denominations: [1000, 500, 200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.14,
  },
  {
    code: 'HUF',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    denominations: [20000, 10000, 5000, 2000, 1000, 500],
    exchangeRateToUsd: 0.0028,
  },
  {
    code: 'ISK',
    name: 'Icelandic Króna',
    symbol: 'kr',
    denominations: [10000, 5000, 2000, 1000, 500],
    exchangeRateToUsd: 0.0072,
  },
  {
    code: 'MDL',
    name: 'Moldovan Leu',
    symbol: 'L',
    denominations: [1000, 500, 200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.056,
  },
  {
    code: 'MKD',
    name: 'Macedonian Denar',
    symbol: 'ден',
    denominations: [2000, 1000, 500, 200, 100, 50, 10],
    exchangeRateToUsd: 0.018,
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    denominations: [1000, 500, 200, 100, 50],
    exchangeRateToUsd: 0.093,
  },
  {
    code: 'PLN',
    name: 'Polish Złoty',
    symbol: 'zł',
    denominations: [500, 200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.25,
  },
  {
    code: 'RON',
    name: 'Romanian Leu',
    symbol: 'lei',
    denominations: [500, 200, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.22,
  },
  {
    code: 'RSD',
    name: 'Serbian Dinar',
    symbol: 'дин',
    denominations: [5000, 2000, 1000, 500, 200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.0093,
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    denominations: [5000, 2000, 1000, 500, 200, 100, 50],
    exchangeRateToUsd: 0.010,
  },
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    denominations: [1000, 500, 200, 100, 50, 20],
    exchangeRateToUsd: 0.096,
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    denominations: [200, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.029,
  },
  {
    code: 'UAH',
    name: 'Ukrainian Hryvnia',
    symbol: '₴',
    denominations: [1000, 500, 200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.027,
  },

  // === ASIA ===
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    denominations: [1000, 500, 200, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.27,
  },
  {
    code: 'AFN',
    name: 'Afghan Afghani',
    symbol: '؋',
    denominations: [1000, 500, 100, 50, 20, 10],
    exchangeRateToUsd: 0.014,
  },
  {
    code: 'AMD',
    name: 'Armenian Dram',
    symbol: '֏',
    denominations: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
    exchangeRateToUsd: 0.0026,
  },
  {
    code: 'AZN',
    name: 'Azerbaijani Manat',
    symbol: '₼',
    denominations: [200, 100, 50, 20, 10, 5, 1],
    exchangeRateToUsd: 0.59,
  },
  {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    denominations: [1000, 500, 100, 50, 20, 10],
    exchangeRateToUsd: 0.0091,
  },
  {
    code: 'BHD',
    name: 'Bahraini Dinar',
    symbol: '.د.ب',
    denominations: [20, 10, 5, 1],
    exchangeRateToUsd: 2.65,
  },
  {
    code: 'BND',
    name: 'Brunei Dollar',
    symbol: '$',
    denominations: [10000, 1000, 500, 100, 50, 10, 5, 1],
    exchangeRateToUsd: 0.74,
  },
  {
    code: 'BTN',
    name: 'Bhutanese Ngultrum',
    symbol: 'Nu.',
    denominations: [1000, 500, 100, 50, 20, 10, 5, 1],
    exchangeRateToUsd: 0.012,
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    denominations: [100, 50, 20, 10, 5, 1],
    exchangeRateToUsd: 0.14,
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    denominations: [1000, 500, 100, 50, 20, 10],
    exchangeRateToUsd: 0.13,
  },
  {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    denominations: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
    exchangeRateToUsd: 0.000064,
  },
  {
    code: 'ILS',
    name: 'Israeli Shekel',
    symbol: '₪',
    denominations: [200, 100, 50, 20],
    exchangeRateToUsd: 0.27,
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    denominations: [2000, 500, 200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.012,
  },
  {
    code: 'IQD',
    name: 'Iraqi Dinar',
    symbol: 'ع.د',
    denominations: [50000, 25000, 10000, 5000, 1000, 500, 250],
    exchangeRateToUsd: 0.00076,
  },
  {
    code: 'IRR',
    name: 'Iranian Rial',
    symbol: '﷼',
    denominations: [1000000, 500000, 100000, 50000, 20000, 10000],
    exchangeRateToUsd: 0.000024,
  },
  {
    code: 'JOD',
    name: 'Jordanian Dinar',
    symbol: 'د.ا',
    denominations: [50, 20, 10, 5, 1],
    exchangeRateToUsd: 1.41,
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    denominations: [10000, 5000, 2000, 1000],
    exchangeRateToUsd: 0.0067,
  },
  {
    code: 'KGS',
    name: 'Kyrgyzstani Som',
    symbol: 'с',
    denominations: [5000, 1000, 500, 200, 100, 50, 20],
    exchangeRateToUsd: 0.011,
  },
  {
    code: 'KHR',
    name: 'Cambodian Riel',
    symbol: '៛',
    denominations: [50000, 10000, 5000, 2000, 1000, 500, 100],
    exchangeRateToUsd: 0.00025,
  },
  {
    code: 'KPW',
    name: 'North Korean Won',
    symbol: '₩',
    denominations: [5000, 1000, 500, 200, 100, 50, 10, 5],
    exchangeRateToUsd: 0.0011,
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    denominations: [50000, 10000, 5000, 1000],
    exchangeRateToUsd: 0.00077,
  },
  {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'د.ك',
    denominations: [20, 10, 5, 1],
    exchangeRateToUsd: 3.25,
  },
  {
    code: 'KZT',
    name: 'Kazakhstani Tenge',
    symbol: '₸',
    denominations: [20000, 10000, 5000, 2000, 1000, 500, 200],
    exchangeRateToUsd: 0.0021,
  },
  {
    code: 'LAK',
    name: 'Lao Kip',
    symbol: '₭',
    denominations: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
    exchangeRateToUsd: 0.000046,
  },
  {
    code: 'LBP',
    name: 'Lebanese Pound',
    symbol: 'ل.ل',
    denominations: [100000, 50000, 20000, 10000, 5000, 1000],
    exchangeRateToUsd: 0.000011,
  },
  {
    code: 'LKR',
    name: 'Sri Lankan Rupee',
    symbol: 'Rs',
    denominations: [5000, 2000, 1000, 500, 100, 50, 20],
    exchangeRateToUsd: 0.0031,
  },
  {
    code: 'MMK',
    name: 'Myanmar Kyat',
    symbol: 'K',
    denominations: [10000, 5000, 1000, 500, 200, 100, 50],
    exchangeRateToUsd: 0.00048,
  },
  {
    code: 'MNT',
    name: 'Mongolian Tögrög',
    symbol: '₮',
    denominations: [20000, 10000, 5000, 1000, 500, 100],
    exchangeRateToUsd: 0.00029,
  },
  {
    code: 'MOP',
    name: 'Macanese Pataca',
    symbol: 'MOP$',
    denominations: [1000, 500, 100, 50, 20, 10],
    exchangeRateToUsd: 0.12,
  },
  {
    code: 'MVR',
    name: 'Maldivian Rufiyaa',
    symbol: '.ރ',
    denominations: [1000, 500, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.065,
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    denominations: [100, 50, 20, 10, 5, 1],
    exchangeRateToUsd: 0.22,
  },
  {
    code: 'NPR',
    name: 'Nepalese Rupee',
    symbol: 'Rs',
    denominations: [1000, 500, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.0075,
  },
  {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'ر.ع.',
    denominations: [50, 20, 10, 5, 1],
    exchangeRateToUsd: 2.60,
  },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    denominations: [1000, 500, 200, 100, 50, 20],
    exchangeRateToUsd: 0.018,
  },
  {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: 'Rs',
    denominations: [5000, 1000, 500, 100, 50, 20, 10],
    exchangeRateToUsd: 0.0036,
  },
  {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: 'ر.ق',
    denominations: [500, 100, 50, 10, 5, 1],
    exchangeRateToUsd: 0.27,
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'ر.س',
    denominations: [500, 100, 50, 10, 5, 1],
    exchangeRateToUsd: 0.27,
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    denominations: [10000, 1000, 100, 50, 10, 5, 2],
    exchangeRateToUsd: 0.74,
  },
  {
    code: 'SYP',
    name: 'Syrian Pound',
    symbol: '£S',
    denominations: [5000, 2000, 1000, 500, 200, 100, 50],
    exchangeRateToUsd: 0.00040,
  },
  {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    denominations: [1000, 500, 100, 50, 20],
    exchangeRateToUsd: 0.029,
  },
  {
    code: 'TJS',
    name: 'Tajikistani Somoni',
    symbol: 'ЅМ',
    denominations: [500, 200, 100, 50, 20, 10, 5, 1],
    exchangeRateToUsd: 0.092,
  },
  {
    code: 'TMT',
    name: 'Turkmenistani Manat',
    symbol: 'm',
    denominations: [500, 100, 50, 20, 10, 5, 1],
    exchangeRateToUsd: 0.29,
  },
  {
    code: 'TWD',
    name: 'Taiwan Dollar',
    symbol: 'NT$',
    denominations: [2000, 1000, 500, 200, 100],
    exchangeRateToUsd: 0.032,
  },
  {
    code: 'UZS',
    name: 'Uzbekistani Som',
    symbol: "so'm",
    denominations: [100000, 50000, 10000, 5000, 1000, 500, 200, 100],
    exchangeRateToUsd: 0.000078,
  },
  {
    code: 'VND',
    name: 'Vietnamese Đồng',
    symbol: '₫',
    denominations: [500000, 200000, 100000, 50000, 20000, 10000],
    exchangeRateToUsd: 0.000040,
  },
  {
    code: 'YER',
    name: 'Yemeni Rial',
    symbol: '﷼',
    denominations: [1000, 500, 250, 100, 50],
    exchangeRateToUsd: 0.0040,
  },

  // === AFRICA ===
  {
    code: 'DZD',
    name: 'Algerian Dinar',
    symbol: 'د.ج',
    denominations: [2000, 1000, 500, 200, 100],
    exchangeRateToUsd: 0.0074,
  },
  {
    code: 'AOA',
    name: 'Angolan Kwanza',
    symbol: 'Kz',
    denominations: [5000, 2000, 1000, 500, 200, 100, 50],
    exchangeRateToUsd: 0.0012,
  },
  {
    code: 'BWP',
    name: 'Botswana Pula',
    symbol: 'P',
    denominations: [200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.073,
  },
  {
    code: 'EGP',
    name: 'Egyptian Pound',
    symbol: 'E£',
    denominations: [200, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.020,
  },
  {
    code: 'ETB',
    name: 'Ethiopian Birr',
    symbol: 'Br',
    denominations: [200, 100, 50, 10, 5, 1],
    exchangeRateToUsd: 0.0080,
  },
  {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    symbol: 'GH₵',
    denominations: [200, 100, 50, 20, 10, 5, 2, 1],
    exchangeRateToUsd: 0.065,
  },
  {
    code: 'GMD',
    name: 'Gambian Dalasi',
    symbol: 'D',
    denominations: [200, 100, 50, 25, 20, 10, 5],
    exchangeRateToUsd: 0.015,
  },
  {
    code: 'GNF',
    name: 'Guinean Franc',
    symbol: 'Fr',
    denominations: [20000, 10000, 5000, 1000, 500, 100],
    exchangeRateToUsd: 0.00012,
  },
  {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    denominations: [1000, 500, 200, 100, 50],
    exchangeRateToUsd: 0.0077,
  },
  {
    code: 'LRD',
    name: 'Liberian Dollar',
    symbol: '$',
    denominations: [100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.0052,
  },
  {
    code: 'LSL',
    name: 'Lesotho Loti',
    symbol: 'L',
    denominations: [200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.054,
  },
  {
    code: 'LYD',
    name: 'Libyan Dinar',
    symbol: 'ل.د',
    denominations: [50, 20, 10, 5, 1],
    exchangeRateToUsd: 0.21,
  },
  {
    code: 'MAD',
    name: 'Moroccan Dirham',
    symbol: 'د.م.',
    denominations: [200, 100, 50, 20],
    exchangeRateToUsd: 0.099,
  },
  {
    code: 'MGA',
    name: 'Malagasy Ariary',
    symbol: 'Ar',
    denominations: [20000, 10000, 5000, 2000, 1000, 500, 200, 100],
    exchangeRateToUsd: 0.00022,
  },
  {
    code: 'MRU',
    name: 'Mauritanian Ouguiya',
    symbol: 'UM',
    denominations: [1000, 500, 200, 100, 50, 20],
    exchangeRateToUsd: 0.025,
  },
  {
    code: 'MUR',
    name: 'Mauritian Rupee',
    symbol: '₨',
    denominations: [2000, 1000, 500, 200, 100, 50, 25],
    exchangeRateToUsd: 0.022,
  },
  {
    code: 'MWK',
    name: 'Malawian Kwacha',
    symbol: 'MK',
    denominations: [2000, 1000, 500, 200, 100, 50, 20],
    exchangeRateToUsd: 0.00058,
  },
  {
    code: 'MZN',
    name: 'Mozambican Metical',
    symbol: 'MT',
    denominations: [1000, 500, 200, 100, 50, 20],
    exchangeRateToUsd: 0.016,
  },
  {
    code: 'NAD',
    name: 'Namibian Dollar',
    symbol: '$',
    denominations: [200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.054,
  },
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    denominations: [1000, 500, 200, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.00065,
  },
  {
    code: 'RWF',
    name: 'Rwandan Franc',
    symbol: 'Fr',
    denominations: [5000, 2000, 1000, 500],
    exchangeRateToUsd: 0.00073,
  },
  {
    code: 'SCR',
    name: 'Seychellois Rupee',
    symbol: '₨',
    denominations: [500, 100, 50, 25],
    exchangeRateToUsd: 0.071,
  },
  {
    code: 'SDG',
    name: 'Sudanese Pound',
    symbol: 'ج.س.',
    denominations: [100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 0.0017,
  },
  {
    code: 'SLL',
    name: 'Sierra Leonean Leone',
    symbol: 'Le',
    denominations: [20000, 10000, 5000, 2000, 1000],
    exchangeRateToUsd: 0.000048,
  },
  {
    code: 'SOS',
    name: 'Somali Shilling',
    symbol: 'Sh',
    denominations: [1000, 500, 100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.0018,
  },
  {
    code: 'SSP',
    name: 'South Sudanese Pound',
    symbol: '£',
    denominations: [100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.0013,
  },
  {
    code: 'SZL',
    name: 'Swazi Lilangeni',
    symbol: 'L',
    denominations: [200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.054,
  },
  {
    code: 'TND',
    name: 'Tunisian Dinar',
    symbol: 'د.ت',
    denominations: [50, 20, 10, 5],
    exchangeRateToUsd: 0.32,
  },
  {
    code: 'TZS',
    name: 'Tanzanian Shilling',
    symbol: 'TSh',
    denominations: [10000, 5000, 2000, 1000, 500],
    exchangeRateToUsd: 0.00038,
  },
  {
    code: 'UGX',
    name: 'Ugandan Shilling',
    symbol: 'USh',
    denominations: [50000, 20000, 10000, 5000, 2000, 1000],
    exchangeRateToUsd: 0.00027,
  },
  {
    code: 'XAF',
    name: 'Central African CFA Franc',
    symbol: 'Fr',
    denominations: [10000, 5000, 2000, 1000, 500],
    exchangeRateToUsd: 0.0016,
  },
  {
    code: 'XOF',
    name: 'West African CFA Franc',
    symbol: 'Fr',
    denominations: [10000, 5000, 2000, 1000, 500],
    exchangeRateToUsd: 0.0016,
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    denominations: [200, 100, 50, 20, 10],
    exchangeRateToUsd: 0.053,
  },
  {
    code: 'ZMW',
    name: 'Zambian Kwacha',
    symbol: 'ZK',
    denominations: [100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 0.037,
  },
  {
    code: 'ZWL',
    name: 'Zimbabwean Dollar',
    symbol: 'Z$',
    denominations: [100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 0.0031,
  },

  // === OCEANIA ===
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    denominations: [100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.65,
  },
  {
    code: 'FJD',
    name: 'Fijian Dollar',
    symbol: '$',
    denominations: [100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 0.44,
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    denominations: [100, 50, 20, 10, 5],
    exchangeRateToUsd: 0.60,
  },
  {
    code: 'PGK',
    name: 'Papua New Guinean Kina',
    symbol: 'K',
    denominations: [100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 0.25,
  },
  {
    code: 'TOP',
    name: 'Tongan Paʻanga',
    symbol: 'T$',
    denominations: [100, 50, 20, 10, 5, 2, 1],
    exchangeRateToUsd: 0.42,
  },
  {
    code: 'WST',
    name: 'Samoan Tālā',
    symbol: 'T',
    denominations: [100, 50, 20, 10, 5, 2],
    exchangeRateToUsd: 0.36,
  },
];

export default function MoneyTracking() {
  const { toast } = useToast();
  const {
    getTotalIncome,
    getTotalExpenses,
    getTotalBalance,
    moneyHoldings,
    updateMoneyHoldings,
    syncData
  } = useFinance();

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('holdings');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // State for currencies with exchange rate to USD
  const [currencies, setCurrencies] = useState([
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      denominations: [100, 50, 20, 10, 5, 1],
      exchangeRateToUsd: 1,
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      denominations: [500, 200, 100, 50, 20, 10, 5],
      exchangeRateToUsd: 1 / 0.92, // inverse of usdToEur
    },
    {
      code: 'LBP',
      name: 'Lebanese Pound',
      symbol: 'LBP',
      denominations: [100000, 50000, 20000, 10000, 5000, 1000],
      exchangeRateToUsd: 1 / 89500, // inverse of usdToLbp
    },
  ]);

  // Holdings and bill counts keyed by currency code in lowercase
  const [holdings, setHoldings] = useState(() => {
    const initial = {};
    currencies.forEach((c) => {
      initial[c.code.toLowerCase()] = 0;
    });
    return initial;
  });

  const [billCounts, setBillCounts] = useState(() => {
    const initial = {};
    currencies.forEach((c) => {
      initial[c.code.toLowerCase()] = {};
    });
    return initial;
  });

  // Load from context on mount or when context updates
  useEffect(() => {
    if (moneyHoldings) {
      if (moneyHoldings.holdings && Object.keys(moneyHoldings.holdings).length > 0) {
        setHoldings(prev => moneyHoldings.holdings);
      }
      if (moneyHoldings.billCounts && Object.keys(moneyHoldings.billCounts).length > 0) {
        setBillCounts(moneyHoldings.billCounts);
      }
      // Load active currencies if available
      if (moneyHoldings.currencyData && moneyHoldings.currencyData.length > 0) {
        // Use saved currency data which includes exchange rates
        setCurrencies(moneyHoldings.currencyData);
      } else if (moneyHoldings.activeCurrencies && moneyHoldings.activeCurrencies.length > 0) {
        // Fallback for legacy data: load from commonCurrencies
        const loadedCurrencies = commonCurrencies.filter(c =>
          moneyHoldings.activeCurrencies.includes(c.code)
        );
        if (loadedCurrencies.length > 0) {
          setCurrencies(loadedCurrencies);
        }
      }
    }
  }, [moneyHoldings]);

  const saveToContext = (newHoldings, newBillCounts, currentCurrencies = currencies) => {
    updateMoneyHoldings({
      holdings: newHoldings,
      billCounts: newBillCounts,
      activeCurrencies: currentCurrencies.map(c => c.code),
      currencyData: currentCurrencies, // Save full currency objects including exchange rates
    });
  };

  // Calculate total value in USD by summing all holdings converted to USD
  const calculateTotal = () => {
    let totalInUsd = 0;
    currencies.forEach((c) => {
      const key = c.code.toLowerCase();
      const holding = holdings[key] || 0;
      totalInUsd += holding * c.exchangeRateToUsd;
    });
    return totalInUsd;
  };

  const totalUsd = calculateTotal();
  const totalBalance = getTotalBalance();

  // Calculate total for a specific currency based on bill counts
  const calculateCurrencyTotal = (code) => {
    const key = code.toLowerCase();
    const currency = currencies.find((c) => c.code === code);
    if (!currency) return 0;
    return currency.denominations.reduce(
      (sum, denom) => sum + (billCounts[key]?.[denom] || 0) * denom,
      0
    );
  };

  // Save holdings for a specific currency based on bill counts
  const handleSaveHoldings = (code) => {
    const total = calculateCurrencyTotal(code);
    const newHoldings = { ...holdings, [code.toLowerCase()]: total };
    setHoldings(newHoldings);
    saveToContext(newHoldings, billCounts, currencies);
    toast({
      title: 'Holdings Updated',
      description: `Your ${code} holdings have been updated successfully.`,
    });
  };

  // Handle input change for bill counts
  const handleBillCountChange = (currencyCode, denom, value) => {
    const key = currencyCode.toLowerCase();
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    const newBillCounts = {
      ...billCounts,
      [key]: {
        ...(billCounts[key] || {}),
        [denom]: numValue,
      },
    };
    setBillCounts(newBillCounts);

    // Auto-update holdings total for convenience
    // This mimics the structure but maybe we shouldn't save to context on every keystroke?
    // Debouncing would be better. But for now, let's just update local state and let user click "Update Holdings" 
    // Wait, the original code had "handleSaveHoldings" called by a button? 
    // Looking at the code (I see it in Tabs view later), likely there is a button.
    // The previous code block `handleSaveHoldings` updates `holdings` state.
    // `handleBillCountChange` simply updates `billCounts` state.
    // So I should only `saveToContext` billCounts here.
    saveToContext(holdings, newBillCounts, currencies);
  };

  // Remove currency by code with confirmation
  const handleRemoveCurrency = (code) => {
    if (currencies.length === 1) {
      toast({
        title: 'Cannot Remove Currency',
        description: 'At least one currency must remain.',
        variant: 'destructive',
      });
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to remove the currency ${code}? This action cannot be undone.`
      )
    ) {
      return;
    }
    const codeLower = code.toLowerCase();
    setCurrencies((prev) => prev.filter((c) => c.code !== code));
    setHoldings((prev) => {
      const copy = { ...prev };
      delete copy[codeLower];
      return copy;
    });
    setBillCounts((prev) => {
      const copy = { ...prev };
      delete copy[codeLower];
      return copy;
    });

    // Calculate new currencies list for sync
    const newCurrencies = currencies.filter((c) => c.code !== code);

    // We need to pass the *new* state to saveToContext because setState is async
    // Construct new state objects manually for the save call
    const nextHoldings = { ...holdings };
    delete nextHoldings[codeLower];
    const nextBillCounts = { ...billCounts };
    delete nextBillCounts[codeLower];

    saveToContext(nextHoldings, nextBillCounts, newCurrencies);
    toast({
      title: 'Currency Removed',
      description: `${code} has been removed successfully.`,
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Money Tracking</h2>
            <p className="text-muted-foreground">
              Track your cash and currency holdings
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              onClick={() => syncData(true)}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Sync Now
            </Button>
          </div>
        </div>

        {Math.abs(totalBalance - totalUsd) > 0.009 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Balance Mismatch</AlertTitle>
            <AlertDescription>
              Your total balance ($
              {totalBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              ) does not match your cash holdings ($
              {totalUsd.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              ).{' '}
              {totalBalance > totalUsd
                ? `You need to increase your holdings by $${(totalBalance - totalUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 20 })}.`
                : `You need to decrease your holdings by $${(totalUsd - totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 20 })}.`}{' '}
              Please update your holdings or transactions.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600 dark:border-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Balances Matched</AlertTitle>
            <AlertDescription>
              Your total balance ($
              {totalBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              ) matches your cash holdings.
            </AlertDescription>
          </Alert>
        )}

        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Balance
                </CardTitle>
                <Wallet className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {getTotalBalance().toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Income minus expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Income
                </CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {getTotalIncome().toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All income sources
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {getTotalExpenses().toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All expense sources
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Value (USD)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {totalUsd.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All currencies combined
              </p>
            </CardContent>
          </Card>

          {currencies.map((currency) => {
            const key = currency.code.toLowerCase();
            const holding = holdings[key] || 0;
            const usdValue = holding * currency.exchangeRateToUsd;
            const percentage =
              totalUsd > 0 ? ((usdValue / totalUsd) * 100).toFixed(1) : '0.0';
            return (
              <Card key={currency.code}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {currency.code} Holdings
                  </CardTitle>
                  {currency.code === 'USD' && (
                    <DollarSign className="h-4 w-4 text-success" />
                  )}
                  {currency.code === 'EUR' && (
                    <Euro className="h-4 w-4 text-primary" />
                  )}
                  {currency.code === 'LBP' && (
                    <Coins className="h-4 w-4 text-destructive" />
                  )}
                  {currency.code !== 'USD' &&
                    currency.code !== 'EUR' &&
                    currency.code !== 'LBP' && (
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currency.symbol}
                    {holding.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    $
                    {usdValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    USD ({percentage}% of total)
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

          {/* Mobile View: Dropdown */}
          <div className="md:hidden w-full">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="holdings">Update Holdings</SelectItem>
                <SelectItem value="currencies">Manage Currencies</SelectItem>
                <SelectItem value="exchange">Exchange Rates</SelectItem>
              </SelectContent>
            </Select>
          </div>



          {/* Desktop View: Tabs List */}
          <TabsList className="hidden md:grid w-full grid-cols-3">
            <TabsTrigger value="holdings">Update Holdings</TabsTrigger>
            <TabsTrigger value="currencies">Manage Currencies</TabsTrigger>
            <TabsTrigger value="exchange">Exchange Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="currencies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Currencies</CardTitle>
                <CardDescription>
                  Add or remove currencies for tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currencies.map((currency) => (
                    <Card key={currency.code} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {currency.code}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCurrency(currency.code)}
                            disabled={currencies.length === 1}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription>{currency.name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Symbol: {currency.symbol}</p>
                        <p className="text-sm">
                          Rate: 1 {currency.code} = $
                          {currency.exchangeRateToUsd.toFixed(4)} USD
                        </p>
                        <p className="text-sm">
                          Denominations: {currency.denominations.join(', ')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold mb-4">Add New Currency</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="currency-select">Select Currency</Label>
                      <Select
                        value={selectedCurrency}
                        onValueChange={setSelectedCurrency}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a currency to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonCurrencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => {
                          if (!selectedCurrency) {
                            toast({
                              title: 'No Currency Selected',
                              description: 'Please select a currency to add.',
                              variant: 'destructive',
                            });
                            return;
                          }
                          const currency = commonCurrencies.find(
                            (c) => c.code === selectedCurrency
                          );
                          if (!currency) return;
                          const codeUpper = currency.code.toUpperCase();
                          if (currencies.find((c) => c.code === codeUpper)) {
                            toast({
                              title: 'Duplicate Currency',
                              description: `Currency with code ${codeUpper} already exists.`,
                              variant: 'destructive',
                            });
                            return;
                          }
                          setCurrencies((prev) => [...prev, currency]);
                          setHoldings((prev) => ({
                            ...prev,
                            [codeUpper.toLowerCase()]: 0,
                          }));
                          setBillCounts((prev) => ({
                            ...prev,
                            [codeUpper.toLowerCase()]: {},
                          }));

                          // Sync changes
                          const newCurrencies = [...currencies, currency];
                          const newHoldings = { ...holdings, [codeUpper.toLowerCase()]: 0 };
                          const newBillCounts = { ...billCounts, [codeUpper.toLowerCase()]: {} };
                          saveToContext(newHoldings, newBillCounts, newCurrencies);

                          setSelectedCurrency('');
                          toast({
                            title: 'Currency Added',
                            description: `${codeUpper} has been added successfully.`,
                          });
                        }}
                        className="w-full"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Currency
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exchange" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exchange Rate Settings</CardTitle>
                <CardDescription>
                  Update your currency exchange rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {currencies.map((currency) => (
                    <div key={currency.code} className="space-y-2">
                      <Label htmlFor={`rate-${currency.code}`}>
                        {currency.code === 'LBP' ? `1 USD = ? ${currency.code}` : `1 ${currency.code} = ? USD`}
                      </Label>
                      <Input
                        id={`rate-${currency.code}`}
                        type="number"
                        step={currency.code === 'LBP' ? '1' : '0.0001'}
                        value={currency.code === 'LBP'
                          ? Math.round(1 / currency.exchangeRateToUsd)
                          : currency.exchangeRateToUsd
                        }
                        onChange={(e) => {
                          const inputValue = parseFloat(e.target.value) || 0;
                          // For LBP, convert from "1 USD = X LBP" to exchangeRateToUsd
                          const newRate = currency.code === 'LBP'
                            ? (inputValue > 0 ? 1 / inputValue : 0)
                            : inputValue;
                          const updatedCurrencies = currencies.map((c) =>
                            c.code === currency.code
                              ? { ...c, exchangeRateToUsd: newRate }
                              : c
                          );
                          setCurrencies(updatedCurrencies);
                          // Auto-save exchange rate changes
                          saveToContext(holdings, billCounts, updatedCurrencies);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current rate: 1 {currency.code} = $
                        {currency.exchangeRateToUsd.toFixed(4)} USD
                      </p>
                      {currency.code === 'LBP' && (
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          💡 {Math.round(1 / currency.exchangeRateToUsd).toLocaleString()} LBP = 1 USD
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() =>
                    toast({
                      title: 'Exchange Rates Updated',
                      description: 'Your rates have been saved.',
                    })
                  }
                  className="w-full"
                >
                  Save Exchange Rates
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holdings" className="space-y-4">
            <Tabs
              defaultValue={currencies[0]?.code.toLowerCase()}
              className="space-y-4"
            >
              <TabsList
                className="grid w-full"
                style={{
                  gridTemplateColumns: `repeat(${currencies.length}, 1fr)`,
                }}
              >
                {currencies.map((currency) => (
                  <TabsTrigger
                    key={currency.code}
                    value={currency.code.toLowerCase()}
                  >
                    {currency.code} Bills
                  </TabsTrigger>
                ))}
              </TabsList>

              {currencies.map((currency) => (
                <TabsContent
                  key={currency.code}
                  value={currency.code.toLowerCase()}
                  className="space-y-4"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{currency.name} Bills</CardTitle>
                      <CardDescription>
                        Track your {currency.code} cash bills by denomination
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-4 font-medium text-sm text-muted-foreground border-b pb-2">
                          <span>Denomination</span>
                          <span className="text-center">Bills</span>
                          <span className="text-right">Value</span>
                        </div>
                        {currency.denominations.map((denom) => (
                          <div
                            key={denom}
                            className="grid grid-cols-3 gap-4 items-center py-2 border-b border-muted"
                          >
                            <span className="font-medium">
                              {currency.symbol} {denom.toLocaleString()}
                            </span>
                            <Input
                              type="number"
                              placeholder="0"
                              className="h-8 text-center"
                              min="0"
                              value={
                                billCounts[currency.code.toLowerCase()]?.[
                                denom
                                ] || ''
                              }
                              onChange={(e) =>
                                handleBillCountChange(
                                  currency.code,
                                  denom,
                                  e.target.value
                                )
                              }
                            />
                            <span className="text-right font-medium">
                              {currency.symbol}
                              {(billCounts[currency.code.toLowerCase()]?.[
                                denom
                              ] || 0) * denom}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t-2">
                        <span className="font-semibold">
                          Total {currency.code}
                        </span>
                        <span className="text-xl font-bold">
                          {currency.symbol}
                          {calculateCurrencyTotal(currency.code).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        ≈ $
                        {(
                          calculateCurrencyTotal(currency.code) *
                          currency.exchangeRateToUsd
                        ).toFixed(2)}{' '}
                        USD
                      </div>
                      <Button
                        onClick={() => handleSaveHoldings(currency.code)}
                        className="w-full mt-4"
                      >
                        Save Holdings
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>

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
        entityType="money-holdings"
        title="Money Tracking History"
      />
    </>
  );
}
