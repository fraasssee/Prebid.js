import { logMessage } from '../src/utils.js';
import {ajax} from '../src/ajax.js';
import adapter from '../libraries/analyticsAdapter/AnalyticsAdapter.js';
import CONSTANTS from '../src/constants.json';
import adaptermanager from '../src/adaptermanager.js';

const {
  EVENTS: {
    AUCTION_INIT,
    BID_RESPONSE,
    BID_WON,
    BID_REQUESTED,
    AUCTION_END,
  }
} = CONSTANTS;

const analyticsType = 'endpoint';
const url = 'https://api.us.burthub.com/pbjsAnalytics';

let burtAnalytics = Object.assign(adapter({url, analyticsType}), {
  track({ eventType, args }) {
    switch (eventType) {
      case AUCTION_INIT:
        burtAnalytics.initAuction();
        burtAnalytics.context.accountId = burtAnalytics.initOptions.accountId;
        burtAnalytics.context.auctionId = args.auctionId;
        break;

      case BID_RESPONSE:
        burtAnalytics.events.push({
          context: burtAnalytics.context.merge({type: BID_RESPONSE}),
          event: args,
        });
        break;

      case BID_WON:
        burtAnalytics.events.push({
          context: burtAnalytics.context.merge({type: BID_WON}),
          event: args,
        });
        break;

      case BID_REQUESTED:
        args.bids.forEach((bid) => {
          burtAnalytics.events.push({
            context: burtAnalytics.context.merge({type: BID_REQUESTED}),
            event: bid,
          });
        });
        break;

      case AUCTION_END:
        if (burtAnalytics.events.length > 0) {
          setTimeout(() => burtAnalytics.sendEvents(), 3000);
        }
        break;

      default:
        break;
    }
  }
});

burtAnalytics.initAuction = () => {
  burtAnalytics.events = [];
  burtAnalytics.context = {};
};

burtAnalytics.sendEvents = () => {
  try {
    const body = JSON.stringify(burtAnalytics.events);
    ajax(url, () => {}, body, {
      contentType: 'application/json',
      method: 'POST'
    });
  } catch (err) { logMessage('Burt Analytics error') }
}

// save the base class function
burtAnalytics.originEnableAnalytics = burtAnalytics.enableAnalytics;

// override enableAnalytics so we can get access to the config passed in from the page
burtAnalytics.enableAnalytics = function (config) {
  burtAnalytics.initOptions = config.options;
  burtAnalytics.originEnableAnalytics(config); // call the base class function
};

adaptermanager.registerAnalyticsAdapter({
  adapter: burtAnalytics,
  code: 'burtAnalytics'
});

export default burtAnalytics;
