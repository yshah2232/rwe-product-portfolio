import { useLocation } from 'react-router-dom';
import { ComparisonAssistant } from '@/components/compare/ComparisonAssistant';
import { useRegistryPage } from '@/contexts/RegistryPageContext';

export default function AgentChatbot() {
  const { pathname } = useLocation();
  const { records } = useRegistryPage();
  if (pathname.startsWith('/compare-trials')) return null;
  const ncts = pathname === '/search-registry' ? records.ncts : [];
  return <ComparisonAssistant key={`${pathname}:${ncts.join(',')}`} ncts={ncts} ready guide />;
}
