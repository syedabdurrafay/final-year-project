import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SiMysql, SiMongodb, SiPostgresql } from 'react-icons/si';
import { FaShieldAlt, FaLock, FaUserShield, FaServer, FaPaperPlane, FaChartLine, FaDatabase, FaAws, FaMicrosoft } from 'react-icons/fa';
import { MdOutlineEmail, MdOutlinePerson, MdOutlineMessage } from 'react-icons/md';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import './Home.css';

// Data Analyst-themed 3D Background Components
const DataParticles = () => {
  const particlesRef = useRef();
  const count = 3000;

  useEffect(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 25;
      
      // Data-themed colors (blues, greens, purples)
      if (i % 3 === 0) {
        colors[i] = Math.random() * 0.8; // Blue channel
      } else if (i % 3 === 1) {
        colors[i] = Math.random() * 0.5; // Green channel
      } else {
        colors[i] = Math.random() * 0.3 + 0.7; // Purple/red channel
      }
    }

    for (let i = 0; i < count; i++) {
      sizes[i] = Math.random() * 0.15 + 0.05;
    }

    particlesRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesRef.current.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particlesRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }, []);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.x = clock.getElapsedTime() * 0.03;
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.05;
      
      // Gentle pulsing effect
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(clock.getElapsedTime() + i) * 0.002;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry attach="geometry" />
      <pointsMaterial
        attach="material"
        size={0.08}
        sizeAttenuation={true}
        transparent
        opacity={0.7}
        vertexColors
      />
    </points>
  );
};

// Data Chart Wireframe
const DataChart = () => {
  const meshRef = useRef();
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.15;
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -1, 0]}>
      <cylinderGeometry args={[1, 1, 2, 4, 1, true]} />
      <edgesGeometry attach="geometry" />
      <lineBasicMaterial color="#4FC3F7" transparent opacity={0.3} />
    </mesh>
  );
};

// Floating Database Icons
const FloatingDatabase = () => {
  const meshRef = useRef();
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.2;
      meshRef.current.position.x = Math.sin(clock.getElapsedTime() * 0.5) * 1.5;
      meshRef.current.position.y = Math.cos(clock.getElapsedTime() * 0.3) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[3, 2, -5]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#2962FF" wireframe transparent opacity={0.4} />
    </mesh>
  );
};

// AI Neural Network Visualization
const NeuralNetwork = () => {
  const groupRef = useRef();
  const linesRef = useRef([]);
  
  useEffect(() => {
    // Create neural network nodes and connections
    const nodes = [];
    for (let i = 0; i < 15; i++) {
      nodes.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 3
        )
      });
    }
    
    // Create connections between nodes
    linesRef.current = [];
    nodes.forEach((node, i) => {
      if (i < nodes.length - 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          node.position,
          nodes[i + 1].position
        ]);
        const material = new THREE.LineBasicMaterial({ 
          color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
          transparent: true,
          opacity: 0.3
        });
        linesRef.current.push(new THREE.Line(geometry, material));
        groupRef.current.add(linesRef.current[linesRef.current.length - 1]);
      }
    });
  }, []);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.2;
      groupRef.current.rotation.z = clock.getElapsedTime() * 0.05;
    }
  });

  return <group ref={groupRef} />;
};

const Home = () => {
  // Theme state
  const [currentTheme, setCurrentTheme] = useState('theme-neon-blue');
  
  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  // Customer images
  const customerImages = [
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/68.jpg',
    'https://randomuser.me/api/portraits/men/75.jpg'
  ];

  // Theme selection
  const themes = [
    { name: 'Blue', value: 'theme-neon-blue' },
    { name: 'Purple', value: 'theme-neon-purple' },
    { name: 'Green', value: 'theme-neon-green' },
    { name: 'Red', value: 'theme-neon-red' },
    { name: 'Cyber', value: 'theme-cyberpunk' }
  ];

  return (
    <div className={`home-container ${currentTheme}`}>
      {/* Theme selector */}
      <div className="theme-selector">
        <span>Theme:</span>
        {themes.map(theme => (
          <button
            key={theme.value}
            className={currentTheme === theme.value ? 'active' : ''}
            onClick={() => setCurrentTheme(theme.value)}
          >
            {theme.name}
          </button>
        ))}
      </div>

      {/* Hero Section with Modern Data Analyst 3D Background */}
      <section className="hero-section">
        <div className="canvas-container">
          <Canvas camera={{ position: [0, 0, 12], fov: 75 }}>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.5} color="#4FC3F7" />
            <pointLight position={[-10, -10, -10]} intensity={0.3} color="#FF6EC7" />
            <DataParticles />
            <DataChart />
            <FloatingDatabase />
            <NeuralNetwork />
          </Canvas>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <FaChartLine /> AI-Powered Analytics
          </div>
          <h2 className="hero-title">
            TRANSFORM DATA INTO <span className="highlight">ACTIONABLE INSIGHTS</span>
          </h2>
          <p className="hero-subtitle">
            Leverage cutting-edge AI technology to unlock the full potential of your data
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn-primary">
              <FaChartLine /> Try Free
            </Link>
            <Link to="/login" className="btn-secondary">
              Book Demo
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">97%</span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat">
              <span className="stat-number">5x</span>
              <span className="stat-label">Faster Insights</span>
            </div>
            <div className="stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Monitoring</span>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-line"></div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-section">
        <div className="container">
          <h3 className="section-title">
            Seamless Tech Stack Integration
          </h3>
          <p className="section-subtitle">
            Our platform connects effortlessly with your existing tools and databases
          </p>
          
          <div className="tech-icons">
            <div className="tech-icon">
              <SiMysql size={70} />
              <p>MySQL</p>
            </div>
            <div className="tech-icon">
              <SiMongodb size={70} />
              <p>MongoDB</p>
            </div>
            <div className="tech-icon">
              <SiPostgresql size={70} />
              <p>PostgreSQL</p>
            </div>
            <div className="tech-icon">
              <FaAws size={70} />
              <p>AWS</p>
            </div>
            <div className="tech-icon">
              <FaMicrosoft size={70} />
              <p>Azure</p>
            </div>
          </div>
          
          <Link to="/databases" className="btn-outline">
            <FaDatabase /> View All Supported Databases
          </Link>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <h3 className="section-title">
            Trusted by Industry Leaders
          </h3>
          <p className="section-subtitle">
            Organizations worldwide are transforming their data strategy with our platform
          </p>
          
          <div className="testimonials-grid">
            {[
              {
                quote: "Reduced our data processing time by 80% while improving accuracy. The AI insights have been game-changing.",
                name: "Sarah Johnson",
                position: "CFO, FinTech Corp"
              },
              {
                quote: "Implementation was seamless and the results exceeded our expectations. Our team can now focus on strategy rather than data wrangling.",
                name: "Michael Chen",
                position: "Data Director, RetailChain"
              },
              {
                quote: "The natural language interface allows non-technical staff to get answers instantly. A true democratization of data.",
                name: "David Rodriguez",
                position: "CTO, HealthAnalytics"
              },
              {
                quote: "Customer support has been exceptional. The platform scales beautifully with our growing data needs.",
                name: "Emily Wilson",
                position: "VP Operations, ServiceCo"
              }
            ].map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <div className="quote-icon">"</div>
                  <p className="testimonial-quote">
                    {testimonial.quote}
                  </p>
                  <div className="testimonial-author">
                    <img 
                      src={customerImages[index]} 
                      alt={testimonial.name}
                      className="testimonial-avatar"
                    />
                    <div>
                      <p className="testimonial-name">{testimonial.name}</p>
                      <p className="testimonial-position">{testimonial.position}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="security-section">
        <div className="container">
          <h3 className="section-title">
            Enterprise-Grade Security
          </h3>
          <p className="section-subtitle">
            Your data's security is our top priority with industry-leading protection measures
          </p>
          
          <div className="security-features">
            <div className="security-card">
              <div className="security-icon">
                <FaShieldAlt size={40} />
              </div>
              <h4>AES-256 Encryption</h4>
              <p>
                Military-grade encryption for data at rest and in transit
              </p>
            </div>
            
            <div className="security-card">
              <div className="security-icon">
                <FaLock size={40} />
              </div>
              <h4>Data Privacy</h4>
              <p>
                Strict access controls and data sovereignty compliance
              </p>
            </div>
            
            <div className="security-card">
              <div className="security-icon">
                <FaUserShield size={40} />
              </div>
              <h4>Access Control</h4>
              <p>
                Role-based permissions and multi-factor authentication
              </p>
            </div>
            
            <div className="security-card">
              <div className="security-icon">
                <FaServer size={40} />
              </div>
              <h4>Compliance</h4>
              <p>
                SOC 2, GDPR, HIPAA, and industry-specific certifications
              </p>
            </div>
          </div>
          
          <p className="security-note">
            We undergo regular third-party audits to ensure the highest security standards
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h3 className="section-title">
            Frequently Asked Questions
          </h3>
          
          <div className="faq-container">
            {[
              {
                question: "How is my data stored and processed?",
                answer: "Your data is processed in secure, SOC 2-compliant data centers with AES-256 encryption at rest and in transit. We maintain minimal data retention policies, with temporary processing caches automatically purged after 24 hours."
              },
              {
                question: "Do you use my data for training your models?",
                answer: "No. We have strict data segregation policies and do not use customer data for training our AI models. All data processing is isolated to your organization's instance."
              },
              {
                question: "What compliance certifications do you have?",
                answer: "We're SOC 2 Type II certified and compliant with GDPR, CCPA, and HIPAA requirements. We undergo regular third-party security audits and penetration testing."
              },
              {
                question: "Can I deploy this on-premises or in my private cloud?",
                answer: "Yes, we offer enterprise deployment options including private cloud, on-premises, and hybrid models with dedicated infrastructure and enhanced security controls."
              },
              {
                question: "How quickly can I get started?",
                answer: "You can begin with our cloud offering in minutes. Enterprise deployments typically take 2-4 weeks depending on your infrastructure requirements and security review process."
              }
            ].map((faq, index) => (
              <div key={index} className="faq-item">
                <details className="faq-details">
                  <summary className="faq-question">
                    {faq.question}
                    <span className="faq-icon">+</span>
                  </summary>
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-section">
        <div className="contact-bubble-1"></div>
        <div className="contact-bubble-2"></div>

        <div className="container">
          <div className="contact-content">
            <h3 className="section-title">
              Ready to Transform Your Data Strategy?
            </h3>
            <p className="section-subtitle">
              Contact our team to schedule a demo or discuss your specific requirements
            </p>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <MdOutlinePerson className="form-icon" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <MdOutlineEmail className="form-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Your Email"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <MdOutlineMessage className="form-icon" />
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Your Message"
                  required
                  rows="6"
                  className="form-textarea"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-button"
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <FaPaperPlane /> Send Message
                  </>
                )}
              </button>

              {submitSuccess && (
                <div className="success-message">
                  Thank you! Your message has been sent successfully. We'll contact you shortly.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>AI Data Analyst</h3>
              <p>Transforming data into actionable intelligence</p>
            </div>
            <div className="footer-links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
          <div className="footer-copyright">
            <p>© {new Date().getFullYear()} AI Data Analyst. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;