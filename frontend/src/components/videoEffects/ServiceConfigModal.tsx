import React, { useState } from 'react';
import { X, Save, Settings, Globe, Key, Database } from 'lucide-react';

interface ServiceConfig {
  url: string;
  apiKey: string;
  timeout: number;
  retries: number;
  customParams: { [key: string]: string };
}

interface Service {
  service: string;
  purpose: string;
  required: boolean;
  config?: ServiceConfig;
}

interface ServiceConfigModalProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceId: string, config: ServiceConfig) => void;
}

export function ServiceConfigModal({ service, isOpen, onClose, onSave }: ServiceConfigModalProps) {
  const [config, setConfig] = useState<ServiceConfig>(
    service.config || {
      url: '',
      apiKey: '',
      timeout: 30,
      retries: 3,
      customParams: {}
    }
  );

  const [newParamKey, setNewParamKey] = useState('');
  const [newParamValue, setNewParamValue] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(service.service, config);
    onClose();
  };

  const addCustomParam = () => {
    if (newParamKey.trim() && newParamValue.trim()) {
      setConfig(prev => ({
        ...prev,
        customParams: {
          ...prev.customParams,
          [newParamKey.trim()]: newParamValue.trim()
        }
      }));
      setNewParamKey('');
      setNewParamValue('');
    }
  };

  const removeCustomParam = (key: string) => {
    setConfig(prev => ({
      ...prev,
      customParams: Object.fromEntries(
        Object.entries(prev.customParams).filter(([k]) => k !== key)
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Configure Service</h2>
              <p className="text-gray-400 text-sm capitalize">
                {service.service.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Service Info */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-white font-medium mb-2">Service Purpose</h3>
            <p className="text-gray-300 text-sm">{service.purpose}</p>
            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              service.required 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {service.required ? 'Required' : 'Optional'}
            </div>
          </div>

          {/* API URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              API Endpoint URL
            </label>
            <input
              type="url"
              value={config.url}
              onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://api.example.com/v1/service"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Enter your API key"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* Connection Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Timeout (seconds)</label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                min="1"
                max="300"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Retries</label>
              <input
                type="number"
                value={config.retries}
                onChange={(e) => setConfig(prev => ({ ...prev, retries: parseInt(e.target.value) || 3 }))}
                min="0"
                max="10"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Parameters */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Custom Parameters
            </label>
            
            {/* Add new parameter */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newParamKey}
                onChange={(e) => setNewParamKey(e.target.value)}
                placeholder="Parameter name"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="text"
                value={newParamValue}
                onChange={(e) => setNewParamValue(e.target.value)}
                placeholder="Value"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
              <button
                onClick={addCustomParam}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-400/30 text-blue-400 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Existing parameters */}
            <div className="space-y-2">
              {Object.entries(config.customParams).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex-1">
                    <span className="text-white font-medium text-sm">{key}</span>
                    <span className="text-gray-400 text-sm ml-2">= {value}</span>
                  </div>
                  <button
                    onClick={() => removeCustomParam(key)}
                    className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-400/30 text-blue-400 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}