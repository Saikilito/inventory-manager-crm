import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Menu,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  Users,
  CheckCheck,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

interface Purchase {
  id: string;
  date: string;
  item: string;
  amount: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
}

interface Contact {
  id: string;
  name: string;
  company: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  tier: 'Gold' | 'Basic';
  age: number;
  phone: string;
  email: string;
  avgOrderValue: string;
  totalAggregated: string;
  notes: string;
  online: boolean;
  purchases: Purchase[];
}

interface Message {
  id: string;
  text: string;
  sender: 'client' | 'agent';
  time: string;
}

const INITIAL_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    company: 'Construcciones Pérez',
    avatar: 'JP',
    lastMessage: 'Hola, ¿tienen stock del cemento?',
    time: '14:30',
    unreadCount: 2,
    tier: 'Gold',
    age: 42,
    phone: '+54 11 9876-5432',
    email: 'juan.perez@consperez.com',
    avgOrderValue: '$18,500 MXN',
    totalAggregated: '$148,000 MXN',
    notes: 'Cliente preferencial. Siempre solicita entregas los viernes por la mañana.',
    online: true,
    purchases: [
      { id: 'O-9041', date: '2026-06-15', item: 'Cemento Portland (x50)', amount: '$12,500 MXN', status: 'Completed' },
      { id: 'O-8842', date: '2026-05-10', item: 'Varilla Corrugada (x100)', amount: '$24,000 MXN', status: 'Completed' },
      { id: 'O-8501', date: '2026-04-01', item: 'Mezcladora de Concreto', amount: '$45,000 MXN', status: 'Completed' },
    ],
  },
  {
    id: '2',
    name: 'María García',
    company: 'Súper Mercados del Norte',
    avatar: 'MG',
    lastMessage: 'Pedido enviado con éxito',
    time: '11:15',
    unreadCount: 0,
    tier: 'Gold',
    age: 38,
    phone: '+54 11 4432-1098',
    email: 'm.garcia@supernorte.com.mx',
    avgOrderValue: '$32,000 MXN',
    totalAggregated: '$320,000 MXN',
    notes: 'Pagos siempre al día. Descuento corporativo aplicado del 10%.',
    online: true,
    purchases: [
      { id: 'O-9122', date: '2026-06-22', item: 'Lote Estantería Metálica', amount: '$35,000 MXN', status: 'Pending' },
      { id: 'O-8910', date: '2026-05-20', item: 'Carritos de Súper (x30)', amount: '$48,000 MXN', status: 'Completed' },
      { id: 'O-8611', date: '2026-04-12', item: 'Cajas de Plástico Reutilizables', amount: '$12,000 MXN', status: 'Cancelled' },
    ],
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    company: 'Distribuidora Rodríguez',
    avatar: 'CR',
    lastMessage: '¿Me pueden mandar la cotización?',
    time: 'Ayer',
    unreadCount: 1,
    tier: 'Basic',
    age: 50,
    phone: '+54 11 5567-1122',
    email: 'crodriguez@distrodriguez.com',
    avgOrderValue: '$8,200 MXN',
    totalAggregated: '$41,000 MXN',
    notes: 'Suele pedir cotizaciones por múltiples canales. Seguimiento continuo requerido.',
    online: false,
    purchases: [
      { id: 'O-9005', date: '2026-06-10', item: 'Palets de Madera (x20)', amount: '$6,000 MXN', status: 'Completed' },
      { id: 'O-8751', date: '2026-05-02', item: 'Cinta de Embalaje Profesional', amount: '$2,400 MXN', status: 'Completed' },
      { id: 'O-8410', date: '2026-03-20', item: 'Film Alveolar Burbuja (x5)', amount: '$4,100 MXN', status: 'Completed' },
    ],
  },
  {
    id: '4',
    name: 'Lucía Fernández',
    company: 'Almacén Central',
    avatar: 'LF',
    lastMessage: 'Gracias por la atención rápida',
    time: 'Hace 2 días',
    unreadCount: 0,
    tier: 'Basic',
    age: 29,
    phone: '+54 11 3211-9988',
    email: 'lfernandez@almacencentral.com',
    avgOrderValue: '$14,000 MXN',
    totalAggregated: '$56,000 MXN',
    notes: 'Nueva cliente. Muy activa en canales digitales.',
    online: false,
    purchases: [
      { id: 'O-9080', date: '2026-06-18', item: 'Estanterías de Madera rústica', amount: '$18,000 MXN', status: 'Completed' },
      { id: 'O-8850', date: '2026-05-15', item: 'Mesas de Trabajo Reforzadas', amount: '$24,000 MXN', status: 'Completed' },
      { id: 'O-8530', date: '2026-04-05', item: 'Iluminación LED Industrial', amount: '$14,000 MXN', status: 'Completed' },
    ],
  },
];

export const AgentChatPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputText, setInputQuery] = useState<string>('');
  
  // Responsive sidebar toggles
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  // Accordion segments
  const [openSegments, setOpenSegments] = useState({
    profile: true,
    purchases: true,
    metrics: true,
  });

  const [messagesByContact, setMessagesByContact] = useState<Record<string, Message[]>>({
    '1': [
      { id: '1_1', text: 'Hola, buenas tardes.', sender: 'client', time: '14:30' },
      { id: '1_2', text: 'Hola Juan, ¿en qué podemos ayudarte hoy?', sender: 'agent', time: '14:31' },
      { id: '1_3', text: 'Quería consultar si tienen stock del cemento Portland y el precio por palet.', sender: 'client', time: '14:32' },
    ],
    '2': [
      { id: '2_1', text: 'Ya realicé el pago de la factura #10243.', sender: 'client', time: '11:15' },
      { id: '2_2', text: 'Perfecto María, ya lo registramos en el sistema. El despacho sale mañana por la mañana.', sender: 'agent', time: '11:20' },
      { id: '2_3', text: 'Excelente, muchas gracias por la rapidez de siempre.', sender: 'client', time: '11:22' },
    ],
    '3': [
      { id: '3_1', text: '¿Me podrían enviar la cotización de los perfiles de acero?', sender: 'client', time: 'Ayer' },
      { id: '3_2', text: 'Hola Carlos, te lo envié al correo. Confírmame si te llegó.', sender: 'agent', time: 'Ayer' },
    ],
    '4': [
      { id: '4_1', text: '¿Tienen envíos a la sucursal de Zona Norte?', sender: 'client', time: 'Hace 2 días' },
      { id: '4_2', text: 'Sí Lucía, los despachos para Zona Norte se realizan los días martes y jueves.', sender: 'agent', time: 'Hace 2 días' },
      { id: '4_3', text: 'Genial, gracias por la información.', sender: 'client', time: 'Hace 2 días' },
    ],
  });

  const messageEndRef = useRef<HTMLDivElement>(null);

  const activeContact = contacts.find((c) => c.id === activeContactId) || contacts[0];
  const activeMessages = messagesByContact[activeContact.id] || [];

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeContactId, messagesByContact]);

  const handleSelectContact = (id: string) => {
    setActiveContactId(id);
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
    setIsSidebarOpen(false);
  };

  const toggleSegment = (segment: 'profile' | 'purchases' | 'metrics') => {
    setOpenSegments((prev) => ({
      ...prev,
      [segment]: !prev[segment],
    }));
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const timestamp = new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const newMessage: Message = {
      id: `${activeContact.id}_${Date.now()}`,
      text: inputText.trim(),
      sender: 'agent',
      time: timestamp,
    };

    // Update messages local state
    setMessagesByContact((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMessage],
    }));

    // Update contacts' last message preview
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? { ...c, lastMessage: inputText.trim(), time: 'Ahora' }
          : c
      )
    );

    const sentText = inputText;
    setInputQuery('');

    // Trigger mock response after a slight delay to simulate authentic live interaction
    setTimeout(() => {
      const responses: Record<string, string> = {
        '1': 'Excelente. Quedo a la espera de la cotización formal para procesar la orden de compra.',
        '2': 'Por supuesto. Estaremos atentos a la llegada de la mercadería mañana.',
        '3': 'Recibido. Lo reviso hoy mismo con el departamento de compras y les aviso.',
        '4': 'Perfecto, agendado para el próximo despacho a Zona Norte.',
      };

      const replyText = responses[activeContact.id] || '¡Muchas gracias por el soporte! Lo estaré validando.';

      const replyMessage: Message = {
        id: `${activeContact.id}_reply_${Date.now()}`,
        text: replyText,
        sender: 'client',
        time: new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      };

      setMessagesByContact((prev) => ({
        ...prev,
        [activeContact.id]: [...(prev[activeContact.id] || []), replyMessage],
      }));

      setContacts((prev) =>
        prev.map((c) =>
          c.id === activeContact.id
            ? { ...c, lastMessage: replyText, time: 'Ahora' }
            : c
        )
      );
    }, 1200);
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight">
          Centro de Mensajes
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
          Conversaciones de soporte y ventas en tiempo real con agentes del CRM.
        </p>
      </div>

      <div className="h-[calc(100vh-14rem)] lg:h-[calc(100vh-11rem)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm relative">
        {/* Backdrop for Mobile Sidebar Drawer */}
        {isSidebarOpen && (
          <div
            className="lg:hidden absolute inset-0 bg-stone-900/40 backdrop-blur-xs z-30 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Backdrop for Mobile Dossier Drawer */}
        {isDossierOpen && (
          <div
            className="lg:hidden absolute inset-0 bg-stone-900/40 backdrop-blur-xs z-30 transition-opacity duration-300"
            onClick={() => setIsDossierOpen(false)}
          />
        )}

        {/* COLUMN 1: Conversations List (25% - col-span-3) */}
        <aside
          className={`
            absolute lg:static inset-y-0 left-0 w-80 lg:w-auto lg:col-span-3 bg-white dark:bg-stone-900 z-40
            transition-transform duration-300 ease-out-expo border-r border-stone-200 dark:border-stone-800 flex flex-col h-full
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Header of contacts list */}
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Conversaciones
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-md transition-colors"
              aria-label="Cerrar barra lateral"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-stone-200 dark:border-stone-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs placeholder:text-stone-400 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Contacts Map */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/40">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No se encontraron contactos.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isActive = contact.id === activeContactId;
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact.id)}
                    className={`
                      w-full text-left p-3.5 flex items-start gap-3 transition-colors outline-none focus-visible:bg-stone-50 dark:focus-visible:bg-stone-800/40
                      ${isActive 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-l-2 border-emerald-600' 
                        : 'hover:bg-stone-50/75 dark:hover:bg-stone-800/40 border-l-2 border-transparent'
                      }
                    `}
                  >
                    {/* Avatar Container */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center font-bold text-xs text-stone-700 dark:text-stone-300">
                        {contact.avatar}
                      </div>
                      {contact.online && (
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-stone-900 bg-emerald-500" />
                      )}
                    </div>

                    {/* Meta info block */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-900 dark:text-stone-100'}`}>
                          {contact.name}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">
                          {contact.time}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate mt-0.5">
                        {contact.company}
                      </div>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 truncate">
                        {contact.lastMessage}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {contact.unreadCount > 0 && (
                      <span className="flex-shrink-0 bg-emerald-600 text-white font-bold text-[10px] h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shadow-xs">
                        {contact.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* COLUMN 2: Active Message Feed (50% - col-span-6) */}
        <section className="lg:col-span-6 flex flex-col h-full bg-stone-50/50 dark:bg-stone-950/20 overflow-hidden relative">
          
          {/* Feed Header */}
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {/* Toggle mobile sidebar */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-1.5 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                aria-label="Abrir conversaciones"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Header Active Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center font-bold text-xs text-stone-700 dark:text-stone-300">
                  {activeContact.avatar}
                </div>
                {activeContact.online && (
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-stone-900 bg-emerald-500" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-50">
                    {activeContact.name}
                  </span>
                  {activeContact.online ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700" />
                  )}
                </div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400">
                  {activeContact.company}
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition-colors">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition-colors">
                <Video className="w-4 h-4" />
              </button>
              
              {/* Toggle mobile dossier */}
              <button
                onClick={() => setIsDossierOpen(true)}
                className="lg:hidden p-1.5 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                aria-label="Abrir información del cliente"
              >
                <Info className="w-5 h-5" />
              </button>

              <button className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message Feed Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeMessages.map((message) => {
              const isClient = message.sender === 'client';
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={
                      isClient
                        ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-sm shadow-sm'
                        : 'bg-emerald-600 text-white rounded-2xl rounded-tr-none p-3.5 max-w-[85%] text-sm shadow-sm ml-auto'
                    }
                  >
                    <p className="leading-relaxed">{message.text}</p>
                  </div>
                  <span className="text-[9px] text-stone-400 dark:text-stone-500 font-medium mt-1 px-1 flex items-center gap-1">
                    {message.time}
                    {!isClient && <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  </span>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Responder a ${activeContact.name}...`}
              value={inputText}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 h-11 px-4 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-stone-800 dark:text-stone-100"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="h-11 w-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white disabled:text-stone-400 dark:disabled:text-stone-600 rounded-xl flex items-center justify-center transition-colors shadow-xs flex-shrink-0"
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>

        {/* COLUMN 3: Client Dossier Panel (25% - col-span-3) */}
        <aside
          className={`
            absolute lg:static inset-y-0 right-0 w-80 lg:w-auto lg:col-span-3 bg-white dark:bg-stone-900 z-40
            transition-transform duration-300 ease-out-expo border-l border-stone-200 dark:border-stone-800 flex flex-col h-full
            ${isDossierOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Header of Dossier */}
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              Ficha del Cliente
            </h2>
            <button
              onClick={() => setIsDossierOpen(false)}
              className="lg:hidden p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-md transition-colors"
              aria-label="Cerrar panel de información"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Accordion List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Segment 1: Resumen Perfil */}
            <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-stone-50/50 dark:bg-stone-950/20">
              <button
                onClick={() => toggleSegment('profile')}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 flex items-center justify-between font-bold text-xs text-stone-800 dark:text-stone-200 hover:bg-stone-100/50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <span>RESUMEN PERFIL</span>
                {openSegments.profile ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </button>

              {openSegments.profile && (
                <div className="p-4 space-y-3.5 border-t border-stone-200 dark:border-stone-800/80 animate-[slideDown_0.2s_ease-out]">
                  {/* Name and badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Categoría</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      activeContact.tier === 'Gold' 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' 
                        : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300'
                    }`}>
                      {activeContact.tier}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wider">Compañía</span>
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">{activeContact.company}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wider">Email</span>
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300 break-all">{activeContact.email}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wider">Edad</span>
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{activeContact.age} años</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wider font-semibold">Teléfono</span>
                      <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">{activeContact.phone}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Segment 2: Historial de Compras */}
            <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-stone-50/50 dark:bg-stone-950/20">
              <button
                onClick={() => toggleSegment('purchases')}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 flex items-center justify-between font-bold text-xs text-stone-800 dark:text-stone-200 hover:bg-stone-100/50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <span>HISTORIAL DE COMPRAS</span>
                {openSegments.purchases ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </button>

              {openSegments.purchases && (
                <div className="border-t border-stone-200 dark:border-stone-800/80 animate-[slideDown_0.2s_ease-out]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800">
                          <th className="p-2 text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase">Orden</th>
                          <th className="p-2 text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase">Detalle</th>
                          <th className="p-2 text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800/40">
                        {activeContact.purchases.map((purchase) => (
                          <tr key={purchase.id} className="hover:bg-stone-50 dark:hover:bg-stone-850/20">
                            <td className="p-2">
                              <span className="text-[10px] font-bold text-stone-900 dark:text-stone-50">{purchase.id}</span>
                              <span className="block text-[8px] text-stone-400 mt-0.5">{purchase.date}</span>
                            </td>
                            <td className="p-2">
                              <span className="text-[10px] font-semibold text-stone-700 dark:text-stone-300 truncate max-w-[90px] block" title={purchase.item}>
                                {purchase.item}
                              </span>
                              <span className="block text-[8px] text-stone-400 mt-0.5 tabular-nums">{purchase.amount}</span>
                            </td>
                            <td className="p-2 text-right">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold leading-none ${
                                purchase.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                                  : purchase.status === 'Pending'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                                  : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                              }`}>
                                {purchase.status === 'Completed' ? 'Éxito' : purchase.status === 'Pending' ? 'Pendiente' : 'Cancelado'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Segment 3: Métricas de Rendimiento */}
            <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-stone-50/50 dark:bg-stone-950/20">
              <button
                onClick={() => toggleSegment('metrics')}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 flex items-center justify-between font-bold text-xs text-stone-800 dark:text-stone-200 hover:bg-stone-100/50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <span>MÉTRICAS DE RENDIMIENTO</span>
                {openSegments.metrics ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </button>

              {openSegments.metrics && (
                <div className="p-4 space-y-3.5 border-t border-stone-200 dark:border-stone-800/80 animate-[slideDown_0.2s_ease-out]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wider">Promedio Compra</span>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-100 tabular-nums">{activeContact.avgOrderValue}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wider">Acumulado Total</span>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-100 tabular-nums">{activeContact.totalAggregated}</span>
                  </div>

                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800/50">
                    <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wider mb-1">Notas Internas</span>
                    <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-400 italic">
                      "{activeContact.notes}"
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
};

export default AgentChatPage;
