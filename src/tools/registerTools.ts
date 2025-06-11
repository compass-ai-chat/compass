import { ToolRegistry } from './registry';
import { EmailToolService } from './email.tool';
import { NoteToolService } from './note.tool';
import { WebSearchService } from './websearch.tool';
import { CalculatorToolService } from './calculator.tool';
import { WeatherToolService } from './weather.tool';
import { UnitConverterToolService } from './unitconverter.tool';
import { Tool } from '../types/tools';
import { useTools } from '../hooks/useTools';

export const DEFAULT_TOOLS: Tool[] = [
  {
    id: 'email',
    name: 'Email',
    blueprintId: 'email',
    description: 'Send emails to recipients',
    enabled: true,
    icon: 'mail',
    configValues: {},
  },
  {
    id: 'note',
    name: 'Note',
    blueprintId: 'note',
    description: 'Create and manage notes',
    enabled: true,
    icon: 'pencil',
    configValues: {},
  },
  {
    id: 'websearch',
    name: 'Web Search',
    blueprintId: 'websearch',
    description: 'Search the web for information',
    enabled: true,
    icon: 'search',
    configValues: {},
  },
  {
    id: 'calculator',
    name: 'Calculator',
    blueprintId: 'calculator',
    description: 'Perform mathematical calculations',
    enabled: true,
    icon: 'calculator',
    configValues: {},
  },
  {
    id: 'weather',
    name: 'Weather',
    blueprintId: 'weather',
    description: 'Get current weather information',
    enabled: true,
    icon: 'cloud',
    configValues: {},
  },
  {
    id: 'qrcode',
    name: 'QR Code Generator',
    blueprintId: 'qrcode',
    description: 'Generate QR codes for text or URLs',
    enabled: true,
    icon: 'qr-code',
    configValues: {},
  },
  {
    id: 'password',
    name: 'Password Generator',
    blueprintId: 'password',
    description: 'Generate secure passwords',
    enabled: true,
    icon: 'key',
    configValues: {},
  },
  {
    id: 'unitconverter',
    name: 'Unit Converter',
    blueprintId: 'unitconverter',
    description: 'Convert between different units',
    enabled: true,
    icon: 'swap-horizontal',
    configValues: {},
  },
  {
    id: 'timer',
    name: 'Timer',
    blueprintId: 'timer',
    description: 'Set timers and reminders',
    enabled: true,
    icon: 'timer',
    configValues: {},
  },
];
