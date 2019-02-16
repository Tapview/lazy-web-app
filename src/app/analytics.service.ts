import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  gtag: any;

  constructor() {
    // Load the google analytics script.
    const node = document.createElement('script');
    node.src = 'https://www.googletagmanager.com/gtag/js?id=' +
        environment.googleAnalyticsTrackingId;
    node.type = 'text/javascript';
    node.async = true;
    node.charset = 'utf-8';
    document.getElementsByTagName('head')[0].appendChild(node);

    // Add the gtag function into this component
    this.gtag = window['gtag'];
    // Initialise the gtag
    this.gtag('js', new Date());


    // Facebook Pixel Code
    // Note, that the pixel load <noscript> is not included because Angular
    // cannot be used with noscript
    // !function(f,b,e,v,n,t,s)
    // {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    // n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    // if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    // n.queue=[];t=b.createElement(e);t.async=!0;
    // t.src=v;s=b.getElementsByTagName(e)[0];
    // s.parentNode.insertBefore(t,s)}(window, document,'script',
    // 'https://connect.facebook.net/en_US/fbevents.js');
    // fbq('init', environment.facebookPixelId);
    // fbq('track', 'PageView'); // (this should record all state change events)


    // fbq('track', 'Purchase', {
    //   value: price,
    //   currency: currency,
    //   content_ids: contentId
    // });
    // fbq('track', 'Lead');
    // fbq('track', 'CompleteRegistration');
    // fbq('track', 'AddPaymentInfo');
    // fbq('track', 'AddToCart');
    // fbq('track', 'InitiateCheckout');
    // fbq('track', 'Search');
    // fbq('track', 'ViewContent', {
    //   content_ids: contentId
    // });

  }

  // Events: https://developers.google.com/analytics/devguides/collection/gtagjs/events
  pageView(pagePath, pageTitle) {
    this.gtag('config', environment.googleAnalyticsTrackingId,
        {'page_path': pagePath, 'page_title': pageTitle});
  }

  login() {
    this.gtag('event', 'login', { method : 'email' } ); // standard event
  }

  register() {
    this.gtag('event', 'sign_up', { method : 'email' } ); // standard event
  }

  mailingList() {
    this.gtag('event', 'join_mailing_list');
  }

  customEvent(action: string,
      options: {category?: string, label?: string, value?: number}) {
    if (options.value &&
        (!Number.isInteger(options.value) || options.value < 0)) {
      console.error('Analytics option.value must be an integer and positive.');
      return;
    }
    this.gtag('event', action, options); // standard event
  }
  // Email lead gtag('event', 'email_click', );
  // utm_source=news4&utm_medium=email&utm_campaign=spring-summer
}
