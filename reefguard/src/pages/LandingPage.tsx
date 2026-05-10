import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Activity, Brain, ChevronDown, FileText, Play, Scan, 
  Shield, Sparkles, Sprout, Upload, ArrowRight, FileCheck 
} from 'lucide-react';
import { useRef } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { FloatingBubbles } from '../components/effects/FloatingBubbles';
import { TextReveal, FadeInUp, StaggerContainer, StaggerItem } from '../components/animations/TextReveal';
import { AnimatedCounter } from '../components/animations/AnimatedCounter';
import { heroMetrics, featureCards, howItWorksSteps } from '../data/mockData';

interface LandingPageProps {
  onLaunchDashboard: () => void;
}

// Coral reef images - local files
const coralImages = {
  hero: '/background.avif',
  feature1: '/coral2.gif',
  feature2: '/coral3.jpg',
  feature3: '/coral4.jpg',
  analysis: '/background.avif',
};

// Scrolling features data
const scrollingFeatures = [
  { label: 'Analysis', color: 'cyan' },
  { label: 'Thermal stress detection', color: 'coral' },
  { label: 'Benthic substrate mapping', color: 'cyan' },
  { label: 'AI-powered health reports', color: 'coral' },
  { label: 'Real-time monitoring', color: 'cyan' },
  { label: 'Five-class segmentation', color: 'coral' },
];

function ScrollingBanner() {
  return (
    <div className="w-full bg-ocean-950/80 backdrop-blur-md border-b border-slate-800/50 py-3 overflow-hidden">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Double the items for seamless loop */}
        {[...scrollingFeatures, ...scrollingFeatures].map((feature, index) => (
          <div key={index} className="flex items-center mx-8">
            <span 
              className={`text-sm font-medium ${
                feature.color === 'cyan' ? 'text-cyan-400' : 'text-pink-400'
              }`}
            >
              {feature.label}
            </span>
            <span className="mx-4 text-slate-600">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function LandingPage({ onLaunchDashboard }: LandingPageProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="relative overflow-hidden">
      {/* Scrolling Features Banner */}
      <ScrollingBanner />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">
        <FloatingBubbles count={20} />
        
        {/* Hero Coral Background with Parallax */}
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0 -z-5"
        >
          <div className="absolute inset-0">
            <img
              src={coralImages.hero}
              alt="Beautiful Coral Reef"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/60 via-ocean-900/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/30 via-transparent to-ocean-950/40" />
          </div>
        </motion.div>
        
        <motion.div className="relative z-10 text-center section-padding max-w-5xl mx-auto pt-16 md:pt-24">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.2] tracking-tight">
              <span className="block mb-3 pb-2 bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                Monitor reef health
              </span>
              <span className="block pb-4 font-bold italic bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                with intelligence
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto"
          >
            Intelligent Coral Health Monitoring & Restoration Insights
          </motion.p>

          {/* Description */}
          <FadeInUp delay={0.7} className="max-w-2xl mx-auto mb-12">
            <p className="text-slate-300 text-lg drop-shadow-md">
              Advanced AI segmentation and health analysis for coral reef monitoring. 
              Upload imagery to detect conditions, analyze coverage, and generate comprehensive reports.
            </p>
          </FadeInUp>

          {/* CTA Button */}
          <FadeInUp delay={0.9} className="flex justify-center mb-16">
            <Button size="lg" icon={Play} onClick={onLaunchDashboard}>
              Launch Dashboard
            </Button>
          </FadeInUp>

          {/* Floating Metrics Cards */}
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto" staggerDelay={0.15}>
            {heroMetrics.map((metric) => (
              <StaggerItem key={metric.id}>
                <Card variant="glass" hover glow="cyan" className="p-4 md:p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-reef-cyan" />
                    <span className="text-xs text-slate-300 uppercase tracking-wider">{metric.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <AnimatedCounter 
                      value={metric.value} 
                      suffix={metric.unit === '%' ? '%' : ''}
                      className="text-2xl md:text-3xl font-bold text-white"
                    />
                    {metric.unit !== '%' && metric.unit !== 'Index' && (
                      <span className="text-sm text-slate-400">{metric.unit}</span>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${metric.trend > 0 ? 'text-reef-teal' : 'text-reef-coral'}`}>
                    {metric.trend > 0 ? '+' : ''}{metric.trend}% vs last month
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-slate-400"
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Coral Showcase Section */}
      <section className="relative py-24 section-padding overflow-hidden">
        {/* Background coral images */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full opacity-20">
          <img
            src={coralImages.feature2}
            alt="Coral"
            className="w-full h-full object-cover mask-image-gradient"
            style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Coral Reef Ecosystem</Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
              Protecting Our <span className="text-gradient-coral">Ocean's Rainforests</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Coral reefs support 25% of all marine life while covering less than 1% of the ocean floor. 
              Our AI helps monitor and restore these vital ecosystems.
            </p>
          </FadeInUp>

          {/* Coral Gallery */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.1}>
            <StaggerItem>
              <div className="relative group overflow-hidden rounded-2xl h-80 bg-slate-800">
                <img
                  src={coralImages.feature1}
                  alt="Hard Coral"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-950 via-ocean-950/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Hard Corals</h3>
                  <p className="text-slate-300 text-sm">Scleractinian corals build the reef structure</p>
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="relative group overflow-hidden rounded-2xl h-80 bg-slate-800">
                <img
                  src={coralImages.feature2}
                  alt="Soft Coral"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-950 via-ocean-950/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Soft Corals</h3>
                  <p className="text-slate-300 text-sm">Alcyonaceans add flexibility and diversity</p>
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="relative group overflow-hidden rounded-2xl h-80 bg-slate-800">
                <img
                  src={coralImages.feature3}
                  alt="Marine Life"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1520314337701-b7d4fb898c2a?w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-950 via-ocean-950/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Marine Life</h3>
                  <p className="text-slate-300 text-sm">Reefs support 25% of all marine species</p>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 section-padding">
        <div className="max-w-6xl mx-auto">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Process</Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
              How <span className="text-gradient-cyan">It Works</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From upload to actionable insights in four simple steps
            </p>
          </FadeInUp>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
            {howItWorksSteps.map((step, index) => (
              <StaggerItem key={step.id}>
                <div className="relative">
                  <Card variant="glass" hover glow="cyan" className="p-6 h-full backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-reef-cyan/20 to-reef-cyan/5 flex items-center justify-center">
                        {step.icon === 'Upload' && <Upload className="w-5 h-5 text-reef-cyan" />}
                        {step.icon === 'Scan' && <Scan className="w-5 h-5 text-reef-cyan" />}
                        {step.icon === 'Activity' && <Activity className="w-5 h-5 text-reef-cyan" />}
                        {step.icon === 'FileCheck' && <FileCheck className="w-5 h-5 text-reef-cyan" />}
                      </div>
                      <span className="text-xs font-medium text-reef-cyan">Step {index + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm">{step.description}</p>
                  </Card>
                  
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features Section with Coral Background */}
      <section className="relative py-24 section-padding overflow-hidden">
        {/* Coral background */}
        <div className="absolute left-0 top-0 w-1/4 h-full opacity-10">
          <img
            src={coralImages.analysis}
            alt=""
            className="w-full h-full object-cover"
            style={{ maskImage: 'linear-gradient(to right, black, transparent)' }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Capabilities</Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
              Powerful <span className="text-gradient-cyan">Features</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Everything you need for comprehensive reef monitoring and restoration planning
            </p>
          </FadeInUp>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
            {featureCards.map((feature) => (
              <StaggerItem key={feature.id}>
                <Card 
                  variant="glass" 
                  hover 
                  className={`p-6 h-full bg-gradient-to-br ${feature.color} border-slate-700/30 backdrop-blur-xl`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center">
                      {feature.icon === 'Scan' && <Scan className="w-6 h-6 text-reef-coral" />}
                      {feature.icon === 'Activity' && <Activity className="w-6 h-6 text-reef-teal" />}
                      {feature.icon === 'FileText' && <FileText className="w-6 h-6 text-amber-400" />}
                      {feature.icon === 'Brain' && <Brain className="w-6 h-6 text-purple-400" />}
                      {feature.icon === 'Sprout' && <Sprout className="w-6 h-6 text-emerald-400" />}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Dashboard Preview Section with Coral Imagery */}
      <section className="relative py-24 section-padding overflow-hidden">
        {/* Background coral */}
        <div className="absolute inset-0 opacity-10">
          <img
            src={coralImages.hero}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ocean-950 via-ocean-950/80 to-ocean-950" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <FadeInUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Preview</Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
              Command <span className="text-gradient-cyan">Center</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              A modern scientific interface designed for marine researchers and conservation teams
            </p>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <div className="relative rounded-2xl overflow-hidden">
              {/* Mock Dashboard Preview with Coral Background */}
              <div className="glass-panel p-2">
                <div className="bg-slate-900/80 rounded-xl overflow-hidden">
                  {/* Coral header background */}
                  <div className="relative">
                    <img
                      src={coralImages.feature1}
                      alt=""
                      className="absolute inset-0 w-full h-24 object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-ocean-950 via-ocean-900/80 to-ocean-950" />
                    
                    {/* Mock Header */}
                    <div className="relative flex items-center justify-between p-6 pb-4">
                      <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-reef-cyan" />
                        <span className="font-semibold text-white">ReefSentinel Dashboard</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-reef-coral/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-400/50" />
                        <div className="w-3 h-3 rounded-full bg-reef-teal/50" />
                      </div>
                    </div>
                  </div>

                  {/* Mock KPI Row */}
                  <div className="p-6 pt-2">
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {heroMetrics.slice(0, 4).map((metric) => (
                        <div key={metric.id} className="glass-card p-4 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">{metric.label}</div>
                          <div className="text-xl font-bold text-white">{metric.value}{metric.unit === '%' ? '%' : ''}</div>
                        </div>
                      ))}
                    </div>

                    {/* Mock Content Area with Coral Image */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 relative rounded-lg overflow-hidden h-48">
                        <img
                          src={coralImages.analysis}
                          alt="Segmentation"
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/80 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <span className="text-sm text-slate-300">Segmentation Visualization</span>
                        </div>
                      </div>
                      <div className="glass-card rounded-lg h-48 flex items-center justify-center">
                        <div className="text-center">
                          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                          <span className="text-slate-500 text-sm">Health Metrics</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-reef-cyan/20 via-reef-teal/10 to-reef-coral/20 rounded-2xl blur-xl -z-10 opacity-50" />
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* CTA Section with Coral Background */}
      <section className="relative py-24 section-padding overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={coralImages.hero}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ocean-950 via-ocean-950/90 to-ocean-950" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeInUp>
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
              Ready to Protect Our <span className="text-gradient-cyan">Reefs</span>?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Join marine researchers and conservation teams using ReefSentinel to monitor, 
              analyze, and restore coral reef ecosystems worldwide.
            </p>
            <Button size="lg" icon={Play} onClick={onLaunchDashboard}>
              Get Started Now
            </Button>
          </FadeInUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 section-padding border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-reef-cyan" />
            <span className="font-semibold text-white">ReefSentinel</span>
          </div>
          <p className="text-slate-500 text-sm">
            Intelligent Coral Health Monitoring & Restoration Insights
          </p>
          <p className="text-slate-600 text-sm">
            © 2024 ReefSentinel. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
