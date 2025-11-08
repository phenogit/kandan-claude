// src/components/home/StockAutocomplete.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';

interface Stock {
  ticker: string;
  name: string;
  nameEn?: string;
  market?: string;
  type?: string;
}

interface StockAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function StockAutocomplete({ 
  value, 
  onChange, 
  placeholder = "搜尋股票代號或名稱..." 
}: StockAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const searchStocks = debounce(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      // Your API returns { stocks: [...] }, not { success, data }
      if (data.stocks) {
        setSuggestions(data.stocks);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to search stocks:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  useEffect(() => {
    searchStocks(value);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStock = (stock: Stock) => {
    onChange(stock.ticker);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((stock) => (
            <button
              key={stock.ticker}
              onClick={() => handleSelectStock(stock)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{stock.ticker}</span>
                <span className="text-sm text-gray-600">{stock.name}</span>
              </div>
              {stock.nameEn && (
                <span className="text-xs text-gray-400 max-w-[40%] truncate">
                  {stock.nameEn}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* No Results */}
      {showSuggestions && !isLoading && value && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">找不到符合的股票</p>
        </div>
      )}
    </div>
  );
}