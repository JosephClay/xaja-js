xaja-js
====

A micro ajax library base on [qwest](https://github.com/pyrsmk/qwest) but
with a [jquery](http://api.jquery.com/jQuery.ajax/)-like api. Includes xhr2 
progress events and is built for speed while maintaining a small size.

`npm install xaja-js`

Examples
----
Construct an ajax request:
```javascript
xaja.ajax(url [,options])
    .then(function(res) {
        console.log(res);
    });
```
or
```javascript
var promise = xaja.ajax(options);
promise.then(doSomething)
    .catch(doSomethingElse);
```
get, post, put and delete methods are also available
```javascript
xaja.get(url, data).then(success, failure);
xaja.post(url, data).then(success, failure);
xaja.put(url, data).then(success, failure);
xaja.del(url, data).then(success, failure);
```

JSON defaults
----
Default to JSON and let xaja handle
stringifying your data
```javascript
xaja.default = 'json';

xaja.post('/test', { foo: 'bar' })
	.then(function(res) {
		console.log(res);
	});
```

Settings
----
jQuery settings support:

| Supported   | Not Supported |
| ----------- | ------------- |
| headers     | accepts       |
| mimeType    | traditional   |
| password    | contents      |
| dataType    | scriptCharset |
| error       | context       |
| data        | converters    |
| statusCode  | dataFilter    |
| success     | ifModified    |
| contentType | isLocal       |
| type        | jsonp         |
| url         | jsonpCallback |
| username    | processData   |
| xhr         | global        |
| xhrFields   |
| complete    |
| beforeSend  |
| cache       |
| timeout     |
| crossDomain |
| async       |

Note
----
- Unlike qwest, therea are no `limit` settings.
- More jquery methods/options may be added in the future
- Does not support jquery's deprecated `success`, `error`, `complete` methods
- Supports IE9+

#License

The MIT License (MIT)

Copyright (c) 2014 Joseph Clay

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
