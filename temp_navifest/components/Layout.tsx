
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, HelpCircle, User as UserIcon, LogOut, ChevronRight, UserPlus, Info, Globe, Layers, Star, Camera, Target } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { QRScanner } from './QRScanner';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNicheSelectorOpen, setIsNicheSelectorOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const { user, logout, nicheConfig, allNiches, setCurrentNiche, unlockedNiches } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleNicheSelector = () => setIsNicheSelectorOpen(!isNicheSelectorOpen);

  const isFullScreenPage = 
    location.pathname.includes('/editor/') || 
    location.pathname.includes('/photobooth/') || 
    location.pathname.includes('/marcos-pro/');

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/atlantis-guide', label: 'Guía Atlantis 5.0' },
    { to: '/marketing-digital', label: 'Marketing Interactivo Digital' },
    { to: '/faq', label: 'Preguntas Frecuentes' },
    { to: '/about', label: 'Nosotros' },
    { to: '/contact', label: 'Contáctenos' },
    { to: '/plans', label: 'Planes de Afiliación' },
    { to: '/terms', label: 'Términos y Condiciones' },
  ];

  if (user) navLinks.push({ to: '/payment-register', label: 'Registro de Pago' });
  if (user?.isAdmin) navLinks.push({ to: '/admin', label: 'Admin Panel' });

  const handleLogout = async () => {
    await logout(); 
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleNicheChange = (nicheId: any) => {
    setCurrentNiche(nicheId);
    setIsNicheSelectorOpen(false);
    setIsMenuOpen(false);
    if (location.pathname !== '/') navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScanResult = (result: string) => {
    setShowScanner(false);
    let detectedNicheId = result;
    
    if (result.startsWith('http')) {
        try {
            const url = new URL(result);
            const searchId = url.searchParams.get('activate') || url.searchParams.get('niche');
            let hashId = null;
            if (url.hash.includes('?')) {
                const hashSearchParams = new URLSearchParams(url.hash.split('?')[1]);
                hashId = hashSearchParams.get('activate') || hashSearchParams.get('niche');
            }
            detectedNicheId = searchId || hashId || detectedNicheId;
        } catch (e) {
            console.warn("Error parsing scanned URL:", e);
        }
    }

    const found = allNiches.find(n => 
      String(n.id).toLowerCase() === String(detectedNicheId).toLowerCase() || 
      n.name.toLowerCase() === String(detectedNicheId).toLowerCase()
    );

    if (found) {
      setCurrentNiche(found.id);
      if (location.pathname !== '/') navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        if (result.startsWith('http')) {
            if (window.confirm("Este código redirige a un recurso externo. ¿Deseas abrirlo?")) {
                window.open(result, '_blank');
            }
        } else {
            alert("Código no reconocido por la red Atlantis.");
        }
    }
  };

  const logoUrl = nicheConfig?.logo_url || 'https://i.ibb.co/9kRPY80z/LOGO-NAVIFEST-FEST-OK.png';
  const baseColor = nicheConfig?.base_color || '#000000';
  const primaryColor = nicheConfig?.primary_color || '#FF2D31';
  const secondaryColor = nicheConfig?.secondary_color || '#FFD700';

  return (
    <div 
        className={`min-h-screen text-white flex flex-col font-sans relative overflow-x-hidden transition-colors duration-1000 ease-in-out ${!isFullScreenPage ? 'pb-20' : ''}`}
        style={{ backgroundColor: baseColor }}
    >
      {showScanner && <QRScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} />}

      {!isFullScreenPage && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-4">
          <button onClick={toggleMenu} className="text-white p-2 hover:bg-white/5 rounded-full">
            <Menu className="w-6 h-6" />
          </button>
          
          <Link to="/" className="flex items-center transform hover:scale-105 transition-transform">
            <img src={logoUrl} alt="Logo" className="h-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
          </Link>

          <button 
              onClick={toggleNicheSelector}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/30 transition-all group relative"
          >
            <Globe size={20} className={nicheConfig?.is_commercial ? 'text-navifest-gold' : 'text-gray-400'} />
            {nicheConfig?.is_commercial && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-navifest-gold rounded-full border-2 border-black animate-pulse"></span>
            )}
          </button>
        </header>
      )}

      {/* Selector de Mundos / Historial B2B */}
      {isNicheSelectorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={toggleNicheSelector}></div>
            <div className="relative bg-navifest-gray border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="absolute top-0 left-0 w-full h-1" style={{ background: primaryColor, opacity: 0.3 }}></div>
                <div className="text-center mb-8 shrink-0">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">ATLANTIS 5.0</h3>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Sincronización Multiverso</p>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-10">
                  {/* Nichos Globales */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 px-2 border-l-2 border-white/10 ml-1">MULTIVERSOS GENERALES</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {allNiches.filter(n => !n.is_commercial).map(n => (
                            <button 
                                key={String(n.id)} 
                                onClick={() => handleNicheChange(n.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-300 aspect-square group ${String(nicheConfig?.id) === String(n.id) ? 'bg-white/10 border-white/40 shadow-xl' : 'bg-black/40 border-white/5 opacity-60 hover:opacity-100'}`}
                            >
                                <img src={n.logo_url} className="h-20 w-full object-contain group-hover:scale-110 transition-transform" alt={n.name} />
                            </button>
                        ))}
                    </div>
                  </div>

                  {/* Historial de Marcas B2B Activadas */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-navifest-gold mb-4 px-2 border-l-2 border-navifest-gold ml-1">TUS MULTIVERSOS</h4>
                    {unlockedNiches.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                          {unlockedNiches.map(access => {
                              const fallbackData = allNiches.find(n => String(n.id) === String(access.niche_id));
                              const displayLogo = access.niche_data?.logo_url || fallbackData?.logo_url;
                              const displayName = access.niche_data?.name || fallbackData?.name || 'Marca Desconocida';

                              return (
                                <button 
                                    key={String(access.id)} 
                                    onClick={() => handleNicheChange(access.niche_id)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-300 aspect-square group relative ${String(nicheConfig?.id) === String(access.niche_id) ? 'bg-navifest-gold/10 border-navifest-gold shadow-xl' : 'bg-black/40 border-white/5 opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={displayLogo} className="h-14 w-full object-contain mb-2 group-hover:scale-110 transition-transform" alt={displayName} />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-navifest-gold/50 text-center truncate w-full">{displayName}</span>
                                    {String(nicheConfig?.id) === String(access.niche_id) && (
                                      <div className="absolute top-2 right-2 w-2 h-2 bg-navifest-gold rounded-full shadow-[0_0_8px_rgba(255,215,0,1)]"></div>
                                    )}
                                </button>
                              );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-6 px-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Aún no has activado multiversos comerciales.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 shrink-0">
                  <button onClick={toggleNicheSelector} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all text-gray-500 hover:text-white">Cerrar</button>
                </div>
            </div>
        </div>
      )}

      {/* Menú Lateral */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={toggleMenu}></div>
          <div className="relative z-10 flex flex-col h-full p-8 max-w-md w-full bg-gradient-to-r from-black/80 to-transparent border-r border-white/10 animate-slide-in">
            <div className="flex justify-between items-center mb-8">
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white font-display">Menú</span>
                    <div className="h-1 w-12 rounded-full mt-1" style={{ backgroundColor: primaryColor }}></div>
                 </div>
                 <button onClick={toggleMenu} className="p-2 bg-white/10 rounded-full"><X className="w-6 h-6 text-white" /></button>
            </div>

            <nav className="flex flex-col gap-2 flex-1 overflow-y-auto no-scrollbar">
              {!user && (
                 <Link 
                    to="/login" 
                    onClick={toggleMenu} 
                    className="flex items-center justify-between p-4 rounded-xl font-bold font-display text-lg mb-4 border transition-all"
                    style={{ 
                      color: secondaryColor, 
                      borderColor: `${secondaryColor}40`,
                      backgroundColor: `${secondaryColor}10`
                    }}
                 >
                    <span>Iniciar Sesión</span>
                    <ChevronRight size={18} />
                 </Link>
              )}

              {navLinks.map((link) => (
                <Link 
                    key={link.to} 
                    to={link.to} 
                    onClick={toggleMenu} 
                    className="text-xl font-display text-white/80 hover:text-white transition-all py-3 border-b border-white/5 flex items-center justify-between group"
                >
                  <span>{link.label}</span>
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: primaryColor }} />
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-white/10">
                {user ? (
                  <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 font-bold hover:text-red-400 w-full p-2">
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                  </button>
                ) : (
                    <div className="text-center text-gray-500 text-[10px] font-black uppercase tracking-widest opacity-40">
                        {nicheConfig?.name} AR © 2025
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 w-full relative z-10 ${!isFullScreenPage ? 'mt-16 px-4 py-6 max-w-5xl mx-auto' : ''}`}>
        {children}
      </main>

      {!isFullScreenPage && (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/5 h-16 z-40 flex justify-around items-center px-2">
          <Link to="/" className={`flex flex-col items-center p-2 transition-all ${location.pathname === '/' ? '' : 'text-gray-400'}`} style={{ color: location.pathname === '/' ? primaryColor : '' }}>
            <Home className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </Link>
          <button 
            onClick={() => setShowScanner(true)}
            className="flex flex-col items-center p-2 text-gray-400 transition-all active:scale-95"
          >
            <Camera className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Scan</span>
          </button>
          <Link to="/plans" className={`flex flex-col items-center p-2 transition-all ${location.pathname === '/plans' ? '' : 'text-gray-400'}`} style={{ color: location.pathname === '/plans' ? primaryColor : '' }}>
            <UserPlus className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Planes</span>
          </Link>
          <Link to="/faq" className={`flex flex-col items-center p-2 transition-all ${location.pathname === '/faq' ? '' : 'text-gray-400'}`} style={{ color: location.pathname === '/faq' ? primaryColor : '' }}>
            <HelpCircle className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Ayuda</span>
          </Link>
        </nav>
      )}
    </div>
  );
};
