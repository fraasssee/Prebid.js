import burtAnalytics from 'modules/burtAnalyticsAdapter.js';
import { logMessage } from 'src/utils.js';
import { expect } from 'chai';
import {expectEvents} from '../../helpers/analytics.js';
const sinon = require('sinon');
let adapterManager = require('src/adapterManager').default;
let events = require('src/events');
let constants = require('src/constants.json');

describe('BurtAnalyticsAdapter', function() {
  let sandbox;
  let xhr;
  let requests;
  let clock;
  let timestamp = 1896134400;
  let auctionId = '9f894496-10fe-4652-863d-623462bf82b8';
  let timeout = 1000;

  before(function () {
    sandbox = sinon.createSandbox();
    xhr = sandbox.useFakeXMLHttpRequest();
    requests = [];

    xhr.onCreate = function (request) {
      requests.push(request);
    };
    clock = sandbox.useFakeTimers(1896134400);
  });

  after(function () {
    sandbox.restore();
  });

  describe('track', function() {
    beforeEach(function () {
      sandbox.stub(events, 'getEvents').returns([]);

      adapterManager.enableAnalytics({
        provider: 'burt'
      });
    });

    afterEach(function () {
      events.getEvents.restore();
      burtAnalytics.events = [];
      burtAnalytics.disableAnalytics();
    });

    it('should catch all events', function() {
      sandbox.spy(burtAnalytics, 'track');
      expectEvents().to.beTrackedBy(burtAnalytics.track);
    });

    it('should report data for BID_REQUESTED, BID_RESPONSE, BID_WON events', function() {
      fireBidEvents(events);
      clock.tick(3000 + 1000);
      const eventsToReport = ['bidResponse', 'bidWon', 'bidRequested'];
      for (var i = 0; i < burtAnalytics.events.length; i++) {
        expect(eventsToReport.indexOf(burtAnalytics.events[i])).to.be.above(-1);
      }

      for (var i = 0; i < eventsToReport.length; i++) {
        expect(burtAnalytics.events.some(function(event) {
          return event === eventsToReport[i]
        })).to.equal(true);
      }
    });
  });

  const bidRequested = {
    bids: [
      {
      }
    ],
  }

  const bidResponse = {
    'bidderCode': 'pubmatic',
    'width': 1030,
    'height': 590,
    'statusMessage': 'Bid available',
    'adId': '13dasd1321ad',
    'requestId': '4062fba2e039919',
    'mediaType': 'banner',
    'source': 'client',
    'cpm': 3,
    'ad': '<script>...</script>',
    'ttl': 250,
    'creativeId': '12345678123',
    'netRevenue': false,
    'currency': 'USD',
    'originalCpm': 5,
    'originalCurrency': 'USD',
    'auctionId': '9f894496-10fe-4652-863d-623462bf82b8',
    'responseTimestamp': 1141412412412,
    'requestTimestamp': 1141412412412,
    'bidder': 'pubmatic',
    'adUnitCode': 'desktop',
    'timeToRespond': 123,
    'status': 'rendered',
    'params': [
      {
        'partnerId': 'cst'
      }
    ]
  }

  const bidWon = {
    'adId': '642f13fe18ab7dc',
    'mediaType': 'banner',
    'requestId': '4062fba2e039919',
    'cpm': 6,
    'creativeId': '138308483085|62bac030-a5d3-11ea-b3be-55590c8153a5',
    'currency': 'USD',
    'netRevenue': false,
    'ttl': 360,
    'auctionId': '9f894496-10fe-4652-863d-623462bf82b8',
    'statusMessage': 'Bid available',
    'responseTimestamp': 1591213790366,
    'requestTimestamp': 1591213790017,
    'bidder': 'pubmatic',
    'adUnitCode': 'desktop_leaderboard_variable',
    'sizes': [[1030, 590]],
    'size': [1030, 590]
  }

  const adUnits = {}

  function fireBidEvents(events) {
    events.emit(constants.EVENTS.AUCTION_INIT, {timestamp, auctionId, timeout, adUnits});
    events.emit(constants.EVENTS.BID_REQUESTED, bidRequested);
    events.emit(constants.EVENTS.BID_RESPONSE, bidResponse);
    events.emit(constants.EVENTS.AUCTION_END, {});
    events.emit(constants.EVENTS.BID_WON, bidWon);
  }
});
