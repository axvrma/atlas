import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  ChevronRight,
  Command,
  GitBranch,
  Layers3,
  LockKeyhole,
  Menu,
  MousePointer2,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Badge, Button } from '@atlas/ui';
import { Brand } from '../components/Brand';
import { ThemeControl } from '../components/ThemeControl';
import { PreviewGraph } from '../components/PreviewGraph';
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="public-nav">
        <Brand />
        <nav aria-label="Product navigation" className={open ? 'open' : ''}>
          <a href="/#product" onClick={() => setOpen(false)}>
            Product
          </a>
          <a href="/#features" onClick={() => setOpen(false)}>
            Features
          </a>
          <Link to="/engineering" onClick={() => setOpen(false)}>
            Engineering
          </Link>
          <Link to="/benchmarks" onClick={() => setOpen(false)}>
            Benchmarks
          </Link>
          <a href="/storybook/">
            Components
            <ArrowUpRight size={11} />
          </a>
        </nav>
        <div className="row">
          <ThemeControl />
          <Link to="/app" className="button button-primary">
            Launch demo
            <ArrowUpRight size={13} />
          </Link>
          <Button
            className="mobile-only"
            variant="ghost"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </Button>
        </div>
      </div>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div>
        <Brand />
        <p>A little clarity for complex workflows.</p>
        <span>© {new Date().getFullYear()} Atlas Studio. An independent engineering project.</span>
      </div>
      <nav aria-label="Footer navigation">
        <Link to="/app">Live demo</Link>
        <Link to="/engineering">Engineering</Link>
        <Link to="/benchmarks">Benchmarks</Link>
        <a href="/storybook/">Components</a>
        <a href="https://github.com/axvrma/atlas" target="_blank" rel="noreferrer">
          Repository target <ArrowUpRight size={11} />
        </a>
      </nav>
    </footer>
  );
}
export default function Landing() {
  return (
    <>
      <PublicHeader />
      <main id="main" tabIndex={-1} className="landing">
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="live-dot" /> A clearer way to build workflows{' '}
            <ChevronRight size={12} />
          </div>
          <h1>
            Design workflows.
            <br />
            Simulate outcomes.
            <br />
            <span>Understand every step.</span>
          </h1>
          <p>
            Complex processes deserve a little clarity. Build visually, test realistic
            <br className="desktop-break" /> scenarios, and follow every decision—all in one
            thoughtful workspace.
          </p>
          <div className="hero-actions">
            <Link to="/app" className="button button-primary">
              <Play size={14} />
              Launch live demo
              <ArrowRight size={14} />
            </Link>
            <Link className="button" to="/engineering">
              Explore engineering
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="hero-reassurance">
            <span>
              <Check size={12} />
              No account needed
            </span>
            <span>
              <Check size={12} />
              100% browser-local
            </span>
            <span>
              <Check size={12} />
              Free to explore
            </span>
          </div>
          <div className="hero-product" id="product">
            <div className="product-caption">
              <span>
                <span className="live-dot" /> THE CANVAS FOR YOUR NEXT IDEA
              </span>
              <span>
                Try running the workflow below <ArrowRight size={12} />
              </span>
            </div>
            <PreviewGraph />
          </div>
        </section>
        <section className="landing-principles">
          <span>MADE FOR THE WAY ENGINEERS THINK</span>
          <div>
            <GitBranch size={17} />
            Visual by design
          </div>
          <div>
            <ShieldCheck size={17} />
            Safe to experiment
          </div>
          <div>
            <Braces size={17} />
            Nothing hidden
          </div>
          <div>
            <LockKeyhole size={17} />
            Local from the start
          </div>
        </section>
        <section className="landing-features" id="features">
          <div className="section-intro">
            <span className="eyebrow">FROM “WHAT IF” TO “NOW I SEE”</span>
            <h2>
              Less guesswork.
              <br />
              More understanding.
            </h2>
            <p>
              A workspace that brings your logic into focus, from the first connection to the final
              output.
            </p>
          </div>
          <div className="feature-detail">
            <div className="feature-icon">
              <MousePointer2 size={20} />
            </div>
            <h3>Think in connections.</h3>
            <p>
              Build with triggers, conditions, transforms, and more. Make the process visible before
              making it real.
            </p>
            <Link to="/app/workflows" className="text-link">
              Explore workflows
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="feature-detail">
            <div className="feature-icon">
              <Play size={20} />
            </div>
            <h3>Test the “what ifs.”</h3>
            <p>
              Try a different input. Take the other branch. Simulate a failure. Find the edge cases
              in a safe local sandbox.
            </p>
            <Link to="/app" className="text-link">
              Run your first simulation
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="feature-detail">
            <div className="feature-icon">
              <Terminal size={20} />
            </div>
            <h3>Follow the whole story.</h3>
            <p>
              Step through real traces. See the data before and after each node, and understand
              exactly where things changed.
            </p>
            <Link to="/app/executions" className="text-link">
              Inspect a sample execution
              <ArrowRight size={12} />
            </Link>
          </div>
        </section>
        <section className="how-it-works">
          <div className="section-intro">
            <span className="eyebrow">A SMALL LOOP. A BIG DIFFERENCE.</span>
            <h2>Design. Simulate. Inspect.</h2>
            <p>Stay curious. Keep iterating. Every run makes the next idea clearer.</p>
          </div>
          <div className="steps-grid">
            {[
              {
                n: '01',
                title: 'Give your idea a shape.',
                text: 'Choose a sample or start fresh. Add nodes, connect the logic, and configure each step.',
                icon: GitBranch,
              },
              {
                n: '02',
                title: 'See what happens.',
                text: 'Run a realistic event through your graph. Local fixtures make every outcome reproducible.',
                icon: Play,
              },
              {
                n: '03',
                title: 'Understand the outcome.',
                text: 'Replay the path, inspect payloads, and compare runs. Turn an unexpected result into a better workflow.',
                icon: Terminal,
              },
            ].map(({ n, title, text, icon: Icon }) => (
              <div key={n}>
                <span className="step-index">{n}</span>
                <Icon size={23} strokeWidth={1.5} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="engineering-teaser">
          <div>
            <Badge tone="purple">
              <Braces size={11} />
              BUILT WITH INTENTION
            </Badge>
            <h2>
              Thoughtful on the surface.
              <br />
              Considered underneath.
            </h2>
            <p>
              Explore the decisions behind Atlas: a framework-independent engine, accessible shared
              components, versioned local storage, and a reproducible static build.
            </p>
            <Link to="/engineering" className="button">
              Inside the engineering
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="engineering-terminal">
            <div className="terminal-top">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
              <span>atlas / engineering</span>
            </div>
            <pre>
              <span className="terminal-purple">const</span> studio = {'{'}
              <br />
              {'  '}execution: <span className="terminal-green">'deterministic'</span>,<br />
              {'  '}state: <span className="terminal-green">'browser-local'</span>,<br />
              {'  '}components: <span className="terminal-green">'shared + accessible'</span>,<br />
              {'  '}curiosity: <span className="terminal-purple">Infinity</span>
              <br />
              {'}'};
            </pre>
            <div className="terminal-note">
              <Check size={12} /> Inspect the source. Reproduce the results.
            </div>
          </div>
        </section>
        <section className="components-teaser">
          <span className="feature-icon">
            <Layers3 size={22} />
          </span>
          <div>
            <h3>The small things make the whole thing.</h3>
            <p>Explore the tokens, components, and interaction patterns behind Atlas Studio.</p>
          </div>
          <a className="button" href="/storybook/">
            Explore component library
            <ArrowUpRight size={13} />
          </a>
        </section>
        <section className="final-cta">
          <div className="cta-orbit" aria-hidden="true">
            <Sparkles size={26} />
          </div>
          <span className="eyebrow">YOUR NEXT IDEA IS WAITING</span>
          <h2>
            Make the complex
            <br />a little more clear.
          </h2>
          <p>Your canvas is ready. No account, no setup, just possibility.</p>
          <Link to="/app" className="button button-primary">
            Launch live demo
            <ArrowRight size={14} />
          </Link>
          <span className="cta-shortcut">
            <Command size={12} /> Built to explore. Designed to understand.
          </span>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
