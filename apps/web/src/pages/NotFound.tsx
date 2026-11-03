import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Brand } from '../components/Brand';
export default function NotFound() {
  return (
    <div className="not-found">
      <Brand />
      <Compass size={45} strokeWidth={1} />
      <span className="eyebrow">404 · A PATH NOT YET CONNECTED</span>
      <h1>A small detour.</h1>
      <p>This page isn’t part of the workflow. Let’s get you back to familiar ground.</p>
      <Link to="/app" className="button button-primary">
        <ArrowLeft size={14} />
        Back to workspace
      </Link>
      <Link className="text-link" to="/">
        Atlas Studio home
      </Link>
    </div>
  );
}
