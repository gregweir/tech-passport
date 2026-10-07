# Aggregate analytics staging

This branch contains a dormant first-party aggregate counter. No request is
made unless the production page contains a same-origin meta value such as:

```html
<meta name="tartanleaf-analytics-endpoint" content="/api/analytics/events">
```

Do not add that meta element until the collector and the public Privacy Policy
have been separately reviewed and approved.

The only permitted payload is a fixed `tech_passport` `app_open` event. It
does not include a route, URL, referrer, query string, identifier, or any Tech
Passport record. In particular it cannot transmit names, devices, accounts,
backups, recovery plans, dependencies, notes, exported records or form values.
The client uses `credentials: "omit"`, refuses cross-origin endpoints, does
not queue offline events, and honours local opt-out, Global Privacy Control and
Do Not Track.

Before activation, verify that the server:

- accepts only the documented schema and rejects all additional fields;
- discards or irreversibly truncates the source IP before event storage;
- does not derive an identifier from IP address, user agent or request timing;
- does not retain raw request logs beyond operational need;
- applies an approved raw-event and aggregate-retention schedule;
- excludes the endpoint from service-worker and CDN response caching; and
- provides deletion, access-control, backup and rollback documentation.

The footer preference control appears only after a valid same-origin endpoint
is configured. GA4 is not part of this implementation.
