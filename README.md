xaja
====

A micro ajax library base on [qwest](https://github.com/pyrsmk/qwest) but with a [jquery](http://api.jquery.com/jQuery.ajax/) api, xhr2 support and promises.

~1.94KB minified and gzipped

Examples
----
Construct an ajax request:
```javascript
xaja.ajax(url [,options])
    .success(function(res) {
        console.log(res);
    });
```
or
```javascript
var promise = xaja.ajax(options);
promise.done(doSomething)
        .fail(doSomethingElse)
        .always(cleanUp);
```
get and post are also available
```javascript
xaja.get(url, data).done(etc);
xaja.post(url, data).done(etc);
```

Settings
----
jQuery settings support:

| Supported   | Not Supported |
| ----------- | ------------- |
| headers     | accepts       |
| mimeType    | timeout       |
| password    | traditional   |
| dataType    | contents      |
| error       | scriptCharset |
| data        | context       |
| statusCode  | converters    |
| success     | crossDomain   |
| contentType | dataFilter    |
| type        | ifModified    |
| url         | isLocal       |
| username    | jsonp         |
| xhr         | jsonpCallback |
| xhrFields   | processData   |
| async       | global        |
| beforeSend  |               |
| cache       |               |
| complete    |               |


Note
----
- Unlike [qwest](https://github.com/pyrsmk/qwest), there's no limit settings.
- Non 'GET' and 'POST' methods are not supported yet.
- This lib is for browsers IE9+, but may work in older browsers.
- Unit tests pending.

License
----

MIT
