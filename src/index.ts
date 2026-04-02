import { initBoldFullScreenNavigation } from './Navbar';
import { initWelcomingWordsLoader } from './PageLoader';
import { initPageTransition } from './PageTransition';

window.Webflow ||= [];
window.Webflow.push(() => {
  initPageTransition();
  initWelcomingWordsLoader();
  initBoldFullScreenNavigation();
});
