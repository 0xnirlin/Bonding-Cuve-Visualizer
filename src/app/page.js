"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const InteractiveBondingCurve = () => {
  // Start with smaller defaults for virtual token reserves
  const [virtualSolReserves, setVirtualSolReserves] = useState(30);
  const [virtualTokenReservesInput, setVirtualTokenReservesInput] = useState("1000000000");
  const [virtualTokenReserves, setVirtualTokenReserves] = useState(1000000000);
  
  const realTokenReserves = 800000000; // Fixed at 800 million
  const tokenIncrement = 10000000; // 10 million tokens
  
  // Handle manual input for token reserves with string state to avoid precision issues
  const handleTokenReservesInputChange = (e) => {
    const inputValue = e.target.value;
    setVirtualTokenReservesInput(inputValue);
    
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue > realTokenReserves) {
      setVirtualTokenReserves(numValue);
    }
  };

  // Add buttons for incrementing/decrementing in specific amounts
  const changeTokenReserves = (amount) => {
    const newValue = Math.max(realTokenReserves + 1, virtualTokenReserves + amount);
    setVirtualTokenReserves(newValue);
    setVirtualTokenReservesInput(newValue.toString());
  };
  
  // Generate data points for price per token increment
  const pricePerIncrementData = useMemo(() => {
    const points = [];
    const k = virtualSolReserves * virtualTokenReserves;
    let cumulativeTokens = 0;
    let previousSolRequired = 0;
    
    while (cumulativeTokens < realTokenReserves) {
      // Calculate the next increment (or remaining tokens if less than increment)
      const nextIncrementAmount = Math.min(tokenIncrement, realTokenReserves - cumulativeTokens);
      if (nextIncrementAmount <= 0) break;
      
      // Calculate how much SOL is needed for this token increment
      // Using the constant product formula: (x + Δx) * (y - Δy) = x * y
      const newVirtualSolReserves = (k / (virtualTokenReserves - cumulativeTokens - nextIncrementAmount));
      const solRequired = newVirtualSolReserves - virtualSolReserves;
      const incrementCost = solRequired - previousSolRequired;
      const incrementPrice = incrementCost / nextIncrementAmount;
      
      points.push({
        tokensBought: cumulativeTokens + nextIncrementAmount,
        incrementCost,
        incrementPrice,
        averagePrice: solRequired / (cumulativeTokens + nextIncrementAmount),
        solTotal: solRequired
      });
      
      previousSolRequired = solRequired;
      cumulativeTokens += nextIncrementAmount;
      
      // Safety check to prevent infinite loops
      if (points.length > 100) break;
    }
    
    return points;
  }, [virtualSolReserves, virtualTokenReserves, realTokenReserves]);
  
  // Generate price curve data
  const priceCurveData = useMemo(() => {
    const points = [];
    const k = virtualSolReserves * virtualTokenReserves;
    const maxTokens = Math.min(realTokenReserves, 790000000); // Cap at slightly below max to keep chart readable
    
    // Starting point - initial price
    points.push({
      tokensSold: 0,
      price: (virtualSolReserves / virtualTokenReserves) * 1000000, // Scale for visibility
      solRequired: 0
    });
    
    for (let tokensSold = maxTokens/100; tokensSold <= maxTokens; tokensSold += maxTokens/100) {
      // Calculate the SOL needed to buy these tokens using constant product formula
      // (virtual_sol + sol_required) * (virtual_tokens - tokens_sold) = k
      const newVirtualSolReserves = k / (virtualTokenReserves - tokensSold);
      const solRequired = newVirtualSolReserves - virtualSolReserves;
      
      // Price after selling these tokens
      const instantPrice = newVirtualSolReserves / (virtualTokenReserves - tokensSold);
      
      points.push({
        tokensSold,
        price: instantPrice * 1000000, // Scale for visibility
        solRequired: solRequired
      });
    }
    
    return points;
  }, [virtualSolReserves, virtualTokenReserves, realTokenReserves]);
  
  const handleSolReservesChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setVirtualSolReserves(value);
    }
  };
  
  // Apply preset configurations
  const applyPreset = (virtualSol, virtualTokens) => {
    setVirtualSolReserves(virtualSol);
    setVirtualTokenReserves(virtualTokens);
    setVirtualTokenReservesInput(virtualTokens.toString());
  };
  
  // Preset configurations
  const presets = [
    { name: "1B tokens", virtualSol: 30, virtualTokens: 1000000000 },
    { name: "10B tokens", virtualSol: 300, virtualTokens: 10000000000 },
    { name: "Large reserves", virtualSol: 3000, virtualTokens: 100000000000 },
    { name: "900M tokens", virtualSol: 30, virtualTokens: 900000000 },
    { name: "850M tokens", virtualSol: 30, virtualTokens: 850000000 },
    { name: "801M tokens", virtualSol: 30, virtualTokens: 801000000 }
  ];
  
  return (
    <div className="w-full space-y-6">
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-blue-800">Interactive Bonding Curve Parameters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <label className="block font-medium text-gray-700">
              Virtual SOL Reserves
              <input 
                type="number" 
                value={virtualSolReserves} 
                onChange={handleSolReservesChange}
                className="mt-2 block w-full p-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
                min="1"
                step="10"
              />
            </label>
            <div className="text-sm text-gray-600 italic">
              Higher values create a flatter curve with less price impact
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="block font-medium text-gray-700">
              Virtual Token Reserves
              <div className="flex items-center mt-2">
                <button 
                  className="px-3 py-3 bg-red-100 hover:bg-red-200 transition font-medium rounded-l-md border-r border-gray-200"
                  onClick={() => changeTokenReserves(-100000000)}
                >
                  -100M
                </button>
                <button 
                  className="px-3 py-3 bg-red-50 hover:bg-red-100 transition font-medium border-r border-gray-200"
                  onClick={() => changeTokenReserves(-10000000)}
                >
                  -10M
                </button>
                <input 
                  type="text" 
                  value={virtualTokenReservesInput} 
                  onChange={handleTokenReservesInputChange}
                  className="block w-full p-3 border text-center shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                />
                <button 
                  className="px-3 py-3 bg-green-50 hover:bg-green-100 transition font-medium border-l border-gray-200"
                  onClick={() => changeTokenReserves(10000000)}
                >
                  +10M
                </button>
                <button 
                  className="px-3 py-3 bg-green-100 hover:bg-green-200 transition font-medium rounded-r-md"
                  onClick={() => changeTokenReserves(100000000)}
                >
                  +100M
                </button>
              </div>
            </label>
            <div className="text-sm text-gray-600 italic">
              Must be greater than {realTokenReserves.toLocaleString()} (real token reserves)
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="font-medium text-gray-700 mb-3">Presets:</div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, index) => (
              <button 
                key={index}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-md shadow-sm transition font-medium"
                onClick={() => applyPreset(preset.virtualSol, preset.virtualTokens)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="p-4 bg-blue-50 rounded-md shadow-sm">
            <div className="font-medium text-gray-700 mb-1">Initial Token Price:</div>
            <div className="text-xl font-mono text-black">{(virtualSolReserves / virtualTokenReserves).toExponential(10)} SOL</div>
          </div>
          <div className="p-4 bg-green-50 rounded-md shadow-sm">
            <div className="font-medium text-gray-700 mb-1">Constant Product (k):</div>
            <div className="text-xl font-mono text-black">{(virtualSolReserves * virtualTokenReserves).toExponential(10)}</div>
          </div>
        </div>
      </div>
      
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-blue-800">Cost for Each 10M Token Increment</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pricePerIncrementData}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="tokensBought" 
                tickFormatter={(value) => (value/1000000) + "M"}
                label={{ value: 'Total Tokens Purchased', position: 'insideBottom', offset: -5, fill: '#666' }} 
                tick={{ fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
              />
              <YAxis 
                label={{ value: 'SOL Cost', angle: -90, position: 'insideLeft', fill: '#666', offset: -15 }}
                tick={{ fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
              />
              <Tooltip 
                formatter={(value) => value.toFixed(4) + " SOL"} 
                labelFormatter={(value) => `After buying ${(value/1000000).toFixed(1)}M tokens`}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: 'none' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }}/>
              <Bar 
                dataKey="incrementCost" 
                name="SOL Cost per 10M Tokens" 
                fill="#8884d8" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-blue-800">SOL Required to Buy Tokens</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={priceCurveData}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="tokensSold" 
                tickFormatter={(value) => (value/1000000) + "M"}
                label={{ value: 'Tokens Purchased (Millions)', position: 'insideBottom', offset: -5, fill: '#666' }} 
                tick={{ fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
                domain={[0, realTokenReserves]}
              />
              <YAxis 
                label={{ value: 'Total SOL Required', angle: -90, position: 'insideLeft', fill: '#666', offset: -15 }}
                tick={{ fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
              />
              <Tooltip 
                formatter={(value) => value.toFixed(4) + " SOL"} 
                labelFormatter={(value) => `To purchase ${(value/1000000).toFixed(1)}M tokens`}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: 'none' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }}/>
              <Line 
                type="monotone" 
                dataKey="solRequired" 
                name="Total SOL Required" 
                stroke="#4f46e5" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-800 flex flex-col md:flex-row justify-between items-center">
          <div>
            <span className="font-semibold">SOL required to purchase all {realTokenReserves.toLocaleString()} tokens:</span>
            {pricePerIncrementData.length > 0 
              ? <span className="ml-2 font-mono font-bold text-xl">{pricePerIncrementData[pricePerIncrementData.length-1].solTotal.toFixed(2)} SOL</span>
              : " (calculation not available)"}
          </div>
          <div className="mt-3 md:mt-0">
            <span className="font-semibold">Initial token price:</span>
            <span className="ml-2 font-mono">{(virtualSolReserves / virtualTokenReserves).toExponential(6)} SOL</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-blue-800">Token Price vs. Tokens Sold</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={priceCurveData}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="tokensSold" 
                tickFormatter={(value) => (value/1000000) + "M"}
                label={{ value: 'Tokens Sold (Millions)', position: 'insideBottom', offset: -5, fill: '#666' }} 
                tick={{ fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
              />
              <YAxis 
                label={{ value: 'Token Price (SOL × 10⁶)', angle: -90, position: 'insideLeft', fill: '#666', offset: -15 }}
                tick={{ fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
              />
              <Tooltip 
                formatter={(value) => (value / 1000000).toFixed(8) + " SOL"} 
                labelFormatter={(value) => `After selling ${(value/1000000).toFixed(1)}M tokens`}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: 'none' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }}/>
              <Line 
                type="monotone" 
                dataKey="price" 
                name="Token Price" 
                stroke="#ff7300" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#ff7300', stroke: '#fff', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h3 className="text-xl font-bold mb-4 text-blue-800">Price Analysis</h3>
        <div className="overflow-auto">
          <table className="min-w-full border-collapse rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100">
                <th className="border border-blue-100 p-3 text-left font-semibold text-blue-900">Tokens Purchased</th>
                <th className="border border-blue-100 p-3 text-left font-semibold text-blue-900">SOL Cost for 10M Increment</th>
                <th className="border border-blue-100 p-3 text-left font-semibold text-blue-900">Price per Token</th>
                <th className="border border-blue-100 p-3 text-left font-semibold text-blue-900">Total SOL Required</th>
              </tr>
            </thead>
            <tbody>
              {pricePerIncrementData.slice(0, 10).map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                  <td className="border border-blue-100 p-3 font-medium text-black">{(item.tokensBought/1000000).toFixed(1)}M</td>
                  <td className="border border-blue-100 p-3 text-black">{item.incrementCost.toFixed(4)} SOL</td>
                  <td className="border border-blue-100 p-3 font-mono text-black">{item.incrementPrice.toFixed(8)} SOL</td>
                  <td className="border border-blue-100 p-3 font-semibold text-black">{item.solTotal.toFixed(4)} SOL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100 text-amber-800">
          <span className="font-semibold">Total SOL required to purchase all {realTokenReserves.toLocaleString()} tokens:</span>
          {pricePerIncrementData.length > 0 
            ? <span className="ml-2 font-mono font-bold">{pricePerIncrementData[pricePerIncrementData.length-1].solTotal.toFixed(2)} SOL</span>
            : " (calculation not available)"}
        </div>
      </div>
    </div>
  );
};

export default InteractiveBondingCurve;