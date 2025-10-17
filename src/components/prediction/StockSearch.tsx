// src/components/prediction/StockSearch.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface Stock {
  ticker: string;
  name: string;
  nameEn?: string;
  market?: string;
  type?: string;
}

interface StockWithPrice extends Stock {
  currentPrice?: number;
  dailyHigh?: number;
  dailyLow?: number;
}

interface Props {
  onSelect: (stock: StockWithPrice) => void;
  error?: string;
}

export default function StockSearch({ onSelect, error }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search stocks
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const searchStocks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.stocks || []);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Stock search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStock = async (stock: Stock) => {
    setQuery(`${stock.ticker} - ${stock.name}`);
    setShowDropdown(false);

    // Fetch current price
    try {
      const response = await fetch(`/api/stocks/price?ticker=${stock.ticker}`);
      if (response.ok) {
        const priceData = await response.json();
        onSelect({
          ...stock,
          currentPrice: priceData.price,
          dailyHigh: priceData.dailyHigh,
          dailyLow: priceData.dailyLow,
        });
      } else {
        // Still select the stock even if price fetch fails
        onSelect({ ...stock });
      }
    } catch (error) {
      console.error('Price fetch error:', error);
      onSelect({ ...stock });
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowDropdown(true)}
          placeholder="輸入股票代碼或名稱 (例: 2330 或台積電)"
          className={`w-full px-4 py-3 pr-10 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowDropdown(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {results.map((stock) => (
            <button
              key={stock.ticker}
              type="button"
              onClick={() => handleSelectStock(stock)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {stock.ticker} - {stock.name}
                  </div>
                  {stock.nameEn && (
                    <div className="text-sm text-gray-500">{stock.nameEn}</div>
                  )}
                </div>
                {stock.market && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {stock.market.toUpperCase()}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && results.length === 0 && query && !isLoading && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          找不到股票，請嘗試其他關鍵字
        </div>
      )}
    </div>
  );
}