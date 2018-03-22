---
title: "Making Ember Addon Installation Smoother"
date: 2018-03-19T22:40:58+02:00
githubIssue: 1
tags: ["programming", "oss", "javascript", "ember"]
draft: false
showTOC: false
---

Ember addon ecosystem is famous because of `ember install <addon-name>` and it just works. It is convenient for addons users and ember-cli API provides a bunch of methods for addons developers to make this process as smooth as possible.

Do you need to add `postcss` package to app dependencies? Easy! Just use `this.addPackageToProject('postcss')` method in your addon [default blueprint](https://ember-cli.com/extending/#default-blueprint).

Or maybe you need to create `postcss.config.js` file? Easy! Add it to files directory in your addon default blueprint.

Sounds like ember-cli has all you need to make your addon usage for end users just one terminal command. But imagine you are developing an addon for integrating with third-party service(let’s say google maps) and you are 100% sure your users will need to add API key to their `environment.js` config to make your addon actually do something. And it turns you have limited choices:

* override entire environment.js file with your keys;
* remind a user to add this keys manually.

Sounds not really ember-ish right? “But there is an addon for this!”

<!--more-->

## So what is my other option?

[ember-cli-config-builder](https://github.com/kolybasov/ember-cli-config-builder) addon was created just to fill this gap and make your users happy!

It is not an ember-addon itself so you need to use npm or yarn. Just type in `npm install --save ember-cli-config-builder` and you are ready to go! As you may remember we are building `ember-google-maps` addon and we need to add it’s config to user’s environment. To do this follow next steps:

### Create `blueprint/ember-google-maps/index.js` file.

It will be our default addon blueprint which ember-cli automatically runs when a user uses `ember install` command.

```javascript
'use strict';
module.exports = {
  name: 'ember-google-maps',
  afterInstall() {
    // place where we will add our logic
  }
};
```

### Next step is to import `ember-cli-config-builder` addon and allow it to do its work.

```javascript
// …
const ConfigBuilder = require('ember-cli-config-builder');
module.exports = {
  // …
  // afterInstall hook supports returning Promise
  // and we will use async/await syntax for clearer code
  // you probably should use `then` syntax yet because async/await
  // is supported only in Node 8+
  async afterInstall() {
    // this.project.configPath() is ember-cli method to get path to
    // environment.js file
    let config = await ConfigBuilder.create(this.project.configPath());
    // ask user to enter API key
    let { apiKey } = await this.ui.prompt([
      {
        message: 'Please past your Google Maps API key to add it to your config:',
        name: 'apiKey'
      }
    ]);
    // there we set `ember-google-maps` key in ENV object to
    // object with a single key `apiKey` and value `placeholder`
    config.set('ember-google-maps', `{ apiKey: '${apiKey}' }`);
    // writing changes to file
    await config.save();
    // notifying user about changed file
    this.ui.writeInfoLine(
      'You apps config has been updated to include Google Maps API key param.'
    );
  }
};
```

### Done!

Now user's config will look like this:

```javascript
// …
let ENV = {
  // …
  'ember-google-maps': {
    apiKey: 'user entered API key'
  }
};
// …
```

## Wait why there are this promises and weird strings instead of JS values?

### Let’s talk about promises first.

`ember-cli-config-builder` uses node’s `fs.readFile()/fs.writeFile()` methods which are asynchronous. However, there is synchronous alternative and the primary target is addon blueprints which do not mind if the thread will be blocked while reading file asynchronous method was chosen to not limit addon usage and you can use it even if your code is critical to blocking threads. Also, ember-cli hooks support Promise return so this should not be a problem especially when async/await syntax will be widely used. There are only two asynchronous methods `ConfigBuilder.create()` and `configBuilderInstance.save()`, all other methods are synchronous.

### Regarding strings.

Remember that we are editing JavaScript source code not just plain object and to make it more clear and reliable you need to pass a string with your value instead of regular value. It is possible to pass regular values but this method is not reliable and not recommended. Passing strings helps to avoid unneeded evaluation and guarantees that you will get the same result as you supplied. There are a few examples how to pass values:

```javascript
// String value: notice surrounding double quotes
config.set('locationType', "'history'");

// Object value: you can use ES2015 template literals for multiline values
config.set(
  'ember-google-maps',
  `{
  apiKey: '${apiKey}'
}`
);

// Numbers/boolean
config.set('timeout', '5000');
config.set('useDefault', 'true');
```

## Any usage advices?

Sure! There are few important questions you need to answer before editing users files(especially inside of default blueprint).

### Do you absolutely need this value to be inside of user config?

Your addon may contain a lot of options and you want to give users ability to specify them all. But maybe it is better to have a fallback(default value) for them. It is always better to have as many sensible defaults as possible but with an ability to change them when needed.
Example: our `ember-google-maps` addon may have option `disableDefaultUI`. It’s ok to assume it is on by default and allow a user to opt out. Pseudocode: `let disableDefaultUI = getWithDefault(config, 'disableDefaultUI', true);` which means if this value is present in user config then it will be used and `true` otherwise.

### Do you need to update ember-cli built-in config value?

So maybe you want to change some Ember value let’s say `rootURL`. It is possible too! But wait are you sure this won’t break build? Of course you are not and eventually, it will break someones build! To avoid this remember few rules:

* It **IS OK** to change this values when user type them so you are moving responsibility and make a user aware of changes.
* It **IS OK** to change this values inside of non-default blueprint which user will run manually. But always remember to notify the user what you changed and where!
* It **IS NOT OK** to change this values automatically inside of default blueprint. Especially silently without any warnings.

### Is this value safe to place inside of config files?

Some kind of values are sensitive to place them in public files. Like secret API keys, user credentials etc. However, most of the keys are made to use on the client side(Ember still front-end framework) please be careful with this kind of values because they may be accidentally committed to public repositories.

## Does this addon have other features?

Yes! Above was the simplest case just to show how easy is to edit ember config files but you can do much more with it.

### Adapters

This addon uses adapters to provide the default set of methods `get/set/remove` for different files. An adapter is automagically chosen by file’s name but can be specified when builder instance is created. Now there are 2 built-in adapters which allow you to edit `environment.js` and `ember-cli-build.js` files. But you can implement your own adapter by extending `BaseAdapter` class and implementing a base set of methods(it is not required but if you do so you will get `getProperties/setProperties/removeProperties/save` methods for free) and registering it with `ConfigBuilder.registerAdapter()` method.

### Paths

When passing key you can use dot-separated nested path(just like in Ember). This allows you to get/set/remove nested keys from objects. Example:

```javascript
config.get('ember-google-maps.apiKey'); // "'your API key'"
```

### Environment Adapter

When you are passing `./path/to/environment.js` path to `ConfigBuilder.create()` Environment Adapter instance is created and you are ready to edit values on default ENV object. If you need to set environment specific values you can get(or create if not exists) environment block which looks like this:

```javascript
if (environment === 'production') {
  // You config there
}
```

To do this use `config.env()` method.

```javascript
// is present id default app blueprint
let productionConfig = config.env('production');
// does not exist by default so in most cases it will be created
let stagingConfig = config.env('staging');
```

When you set some value in environment block result will be similar to this:

```javascript
if (environment === 'production') {
  ENV['ember-google-maps'].apiKey = 'you prod API key';
}
```

### Ember-Cli-Build Adapter

This adapter is used when you need to edit `ember-cli-build.js` file. It has the same default set of methods as environment adapter(except `env`) and allows you to add or remove imports of assets with `addImport/removeImport` methods.
You can use it like this:

```javascript
buildConfig.addImport('node_modules/moment/dist/moment.min.js');
// Will produce
// …
app.import('node_modules/moment/dist/moment.min.js');
// …
return app.toTree();
```

### Saving edited configs

In case you need to save config into a new file and keep original one unchanged you can provide a path to this file into save method.

```javascript
config.save('./path/to/my/new/environment.js');
```

## Is there any alternatives to this addon?

Yep! And this addon was built to replace them but I will share so you can compare by yourself!

[srvance/ember-cli-build-config-editor](https://github.com/srvance/ember-cli-build-config-editor) – uses the same approach with recast AST trees but is have many limits what you can edit and uses it owns non-Ember intuitive API. Also, it moves reading and writing files to user responsibilities.

[benjamn/recast](https://github.com/benjamn/recast) – very powerful but yet very low-level tool to parse, edit and print JavaScript files. `ember-cli-config-builder` wraps it to make editing much easier.

## Conclusion

`ember-cli-config-builder` goal is to provide familiar to Ember developers way to edit config files programmatically. And it is designed to work with default ember-cli generated files. If you have any issues or suggestions please post it to [issues](https://github.com/kolybasov/ember-cli-config-builder) It is a young library and any feedback and testing on edge-cases is appreciated. Also if you like it give it your [star](https://github.com/kolybasov/ember-cli-config-builder)!
