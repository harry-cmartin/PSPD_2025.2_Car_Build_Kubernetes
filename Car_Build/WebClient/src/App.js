import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Mock de carros - mesmos dados do microserviço A
const mockCarros = [
  { "modelo": "fusca", "ano": 2014 },
  { "modelo": "civic", "ano": 2023 },
  { "modelo": "corolla", "ano": 2020 }
];

function App() {
  const [selectedCar, setSelectedCar] = useState(null);
  const [parts, setParts] = useState([]);
  const [selectedParts, setSelectedParts] = useState({}); // {partId: quantidade}
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pricingError, setPricingError] = useState(null);

  const handleCarSelect = async (car) => {
    setSelectedCar(car);
    setSelectedParts({});
    setPricing(null);
    setLoading(true);
    setError(null);
    
    try {
      console.log('Enviando requisição para P-Api:', car);
      
      const response = await axios.post('http://localhost:8000/get-pecas', {
        modelo: car.modelo,
        ano: car.ano
      });
      
      console.log('Resposta recebida:', response.data);
      setParts(response.data.pecas || []);
      
    } catch (err) {
      console.error('Erro ao buscar peças:', err);
      setError(`Erro ao buscar peças: ${err.response?.data?.detail || err.message}`);
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePartQuantityChange = (partId, quantity) => {
    const newSelectedParts = { ...selectedParts };
    
    if (quantity > 0) {
      newSelectedParts[partId] = quantity;
    } else {
      delete newSelectedParts[partId];
    }
    
    setSelectedParts(newSelectedParts);
  };

  //tempo real precos
  useEffect(() => {
    const calculatePricing = async () => {
      const selectedPartsList = Object.entries(selectedParts);
      
      if (selectedPartsList.length === 0) {
        setPricing(null);
        setPricingError(null);
        return;
      }

      setPricingLoading(true);
      setPricingError(null);
      
      try {
        
        const itens = selectedPartsList.map(([partId, quantidade]) => {
          const part = parts.find(p => p.id === partId);
          return {
            peca: {
              id: part.id,
              nome: part.nome,
              valor: part.valor
            },
            quantidade: quantidade
          };
        });
        
        console.log('Calculando preço para itens:', itens);
        
        const response = await axios.post('http://localhost:8000/calcular', {
          itens: itens
        });
        
        console.log('Preço calculado:', response.data);
        setPricing(response.data);
        
      } catch (err) {
        console.error('Erro ao calcular preço:', err);
        setPricingError(err.response?.data?.detail || err.message);
        setPricing(null);
      } finally {
        setPricingLoading(false);
      }
    };

  
    const timeoutId = setTimeout(calculatePricing, 500);
    
    return () => clearTimeout(timeoutId);
  }, [selectedParts, parts]);

  const getMaxQuantity = (part) => {
    // Regra: somente 1 chassi
    if (part.nome.toLowerCase().includes('chassi')) {
      return 1;
    }
    // Outras peças: máximo 5
    return 4;
  };

  const getTotalItems = () => {
    return Object.values(selectedParts).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <div className="app">
      {/* Header Verde */}
      <header className="header">
        <h1>🚗 Catálogo de Peças Automotivas</h1>
        {getTotalItems() > 0 && (
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {getTotalItems()} item(s) selecionado(s)
          </div>
        )}
      </header>

      <div className="main-content">
        {/* Sidebar Verde Claro */}
        <aside className="sidebar">
          <h2>Selecione um Carro</h2>
          <div className="car-list">
            {mockCarros.map((car, index) => (
              <div
                key={index}
                className={`car-card ${selectedCar?.modelo === car.modelo ? 'selected' : ''}`}
                onClick={() => handleCarSelect(car)}
              >
                <h3>{car.modelo}</h3>
                <p>Ano: {car.ano}</p>
              </div>
            ))}
          </div>

          {/* Resumo do Orçamento na Sidebar */}
          {pricing && (
            <div className="pricing-summary">
              <h3>💰 Orçamento</h3>
              <div className="pricing-details">
                <div className="pricing-line">
                  <span>Subtotal:</span>
                  <span>R$ {pricing.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pricing-total">
                  <span>Total:</span>
                  <span>R$ {(pricing.preco ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          {pricingLoading && (
            <div className="pricing-loading">
              <p>🔄 Calculando preço...</p>
            </div>
          )}

          {pricingError && (
            <div className="pricing-error">
              <p>❌ {pricingError}</p>
            </div>
          )}
        </aside>

        {/* Conteúdo Principal */}
        <main className="content">
          {!selectedCar && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <h2>👈 Selecione um carro na barra lateral</h2>
              <p>Escolha um modelo para ver as peças disponíveis</p>
            </div>
          )}

          {selectedCar && (
            <div>
              <h1>Peças para {selectedCar.modelo.toUpperCase()} ({selectedCar.ano})</h1>
              
              {loading && (
                <div className="loading">
                  <p>🔄 Carregando peças...</p>
                </div>
              )}

              {error && (
                <div className="error">
                  <p>{error}</p>
                  <small>Verifique se o P-Api está rodando em http://localhost:8000</small>
                </div>
              )}

              {!loading && !error && parts.length > 0 && (
                <div className="parts-list">
                  <h2>Peças Disponíveis ({parts.length})</h2>
                  <p style={{ color: '#666', marginBottom: '1rem' }}>
                    Selecione as peças e quantidades desejadas. O preço será calculado em tempo real.
                  </p>
                  
                  <div className="parts-grid">
                    {parts.map((part) => {
                      const maxQty = getMaxQuantity(part);
                      const currentQty = selectedParts[part.id] || 0;
                      
                      return (
                        <div key={part.id} className="part-card interactive">
                          <h4>{part.nome}</h4>
                          <div className="price">
                            R$ {part.valor.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </div>
                          <div className="id">ID: {part.id}</div>
                          
                          <div className="quantity-controls">
                            <label>Quantidade:</label>
                            <div className="quantity-input">
                              <button 
                                onClick={() => handlePartQuantityChange(part.id, Math.max(0, currentQty - 1))}
                                disabled={currentQty <= 0}
                                className="qty-btn"
                              >
                                -
                              </button>
                              <span className="qty-display">{currentQty}</span>
                              <button 
                                onClick={() => handlePartQuantityChange(part.id, Math.min(maxQty, currentQty + 1))}
                                disabled={currentQty >= maxQty}
                                className="qty-btn"
                              >
                                +
                              </button>
                            </div>
                            {maxQty === 1 && (
                              <small style={{ color: '#999', fontSize: '0.8rem' }}>
                                Máximo: 1 unidade
                              </small>
                            )}
                            {currentQty > 0 && (
                              <div className="item-total">
                                Subtotal: R$ {(part.valor * currentQty).toLocaleString('pt-BR', { 
                                  minimumFractionDigits: 2 
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!loading && !error && parts.length === 0 && selectedCar && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <p>Nenhuma peça encontrada para este modelo.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;