/*
*   Parsing the Source Codes by han.chen
*   Version: 1.3.3
*   Date: 2015/11/2
*
* */

(function() {
    // 基本设置
    // Baseline setup
    // --------------

    // 创建根对象this = window (浏览器) || global (服务器)
    // Establish the root object, `window` in the browser, or `global` on the server.
    var root = this;

    // 保存_被覆盖之前的值
    // Save the previous value of the `_` variable.
    var previousUnderscore = root._;

    // 创建一个对象，便于内部循环使用
    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};

    // 创建声明保存原声的引用，js在压缩时是不会把原声方法进行压缩，而创建个声明引用则可以被压缩
    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    // 将内置对象原型中的常用方法缓存在局部变量
    // Create quick reference variables for speed access to core prototypes.
    var slice = ArrayProto.slice,
        unshift = ArrayProto.unshift,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    // 定义ECMAScript 5 新增的方法
    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
        nativeForEach = ArrayProto.forEach, // 循环遍历
        nativeMap = ArrayProto.map, // 循环遍历映射 return...
        nativeReduce = ArrayProto.reduce, // 类似于递归的值，第一个参数为上一次执行所返回的值
        nativeReduceRight = ArrayProto.reduceRight, // 与reduce类似，从末尾开始
        nativeFilter = ArrayProto.filter, // 过滤筛选，返回新元素 callback need return true or false
        nativeEvery = ArrayProto.every, // 是否“全部”合乎条件  return true or false
        nativeSome = ArrayProto.some, // 是否“某些项”合乎条件  return true or false
        nativeIndexOf = ArrayProto.indexOf, // 与字符串的indexOf方法类似
        nativeLastIndexOf = ArrayProto.lastIndexOf, // 与indexOf类似，从末尾开始
        nativeIsArray = Array.isArray, // 判断是否为数组  Array.prototype也是一个数组
        nativeKeys = Object.keys, // 获取所有可枚举的属性，返回一个数组
        nativeBind = FuncProto.bind; // 改变this

    // 创建"_"保存一个对象的引用 返回的new wrapper()原型中包含underscore所有方法 （类似将dom包装成jquery对象）
    // Create a safe reference to the Underscore object for use below.
    var _ = function (obj) {
        return new wrapper(obj);
    };

    // 根据不同的环境，将undersocre的命名变量存放到不同的对象中
    if (typeof exports !== 'undefined') {
        // Export the Underscore object for **Node.js**, with
        // backwards-compatibility for the old `require()` API. If we're in
        // the browser, add `_` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode.
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root['_'] = _;
    }

    // 版本声明
    // Current version.
    _.VERSION = '1.3.3';

    // 在"_"对象上定义各种方法
    // Collection Functions
    // --------------------
    var each = _.each = _.forEach = function (obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
            }
        } else {
            for (var key in obj) {
                if (_.has(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) return;
                }
            }
        }
    };

    _.functions = _.methods = function (obj) {
        var names = [];
        for (var key in obj) {
            if (_.isFunction(obj[key])) names.push(key);
        }
        return names.sort();
    };

    _.isFunction = function (obj) {
        return toString.call(obj) == '[object Function]';
    };

    // ......

    // 添加用来测试的方法
    _.testFunction = function(num){
        console.log("_.testFunction:", num);
    };



    // Add your own custom functions to the Underscore object, ensuring that
    // they're correctly added to the OOP wrapper as well.
    _.mixin = function(obj) {
        each(_.functions(obj), function(name){
            addToWrapper(name, _[name] = obj[name]);
        });
    };

    // Add a "chain" function, which will delegate to the wrapper.
    _.chain = function(obj) {
        return _(obj).chain();
    };

    // The OOP Wrapper
    // ---------------

    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.

    // 构造函数wrapper
    var wrapper = function(obj) {
        // 将原始数据存放在_wrapped中
        this._wrapped = obj;
    };

    // "_"继承wrapper的方法
    // Expose `wrapper.prototype` as `_.prototype`
    _.prototype = wrapper.prototype;

    // 在链式操作中用来返回underscore对象
    // Helper function to continue chaining intermediate results.
    var result = function(obj, chain) {
        // 判断当前对象是否进行了链式调用（即_chain是否为true），true 则返回underscore对象，false 返回对象本身。
        return chain ? _(obj).chain() : obj;
    };

    // 将一个自定义方法添加到underscore对象中(实际是添加到wrapper的原型中, 而underscore对象的原型指向了wrapper的原型)
    // A method to easily add functions to the OOP wrapper.
    var addToWrapper = function(name, func) {
        // 向wrapper原型中添加一个name函数
        wrapper.prototype[name] = function() {
            // 获取当前方法的参数
            var args = slice.call(arguments);
            // 将原始数据设置为到第一个参数
            unshift.call(args, this._wrapped);
            // 执行result()返回结果
            return result(func.apply(_, args), this._chain);
        };
    };

    // 将内部定义的_(即underscore方法集合对象)中的方法复制到wrapper的原型链中(即underscore的原型链中)
    // 这是为了在构造对象式调用的underscore对象时, 这些对象也会具有内部定义的underscore方法
    // Add all of the Underscore functions to the wrapper object.
    _.mixin(_);

    // 将Array.prototype中的相关方法添加到underscore对象中, 因此在封装后的underscore对象中也可以直接调用Array.prototype中的方法
    // Add all mutator Array functions to the wrapper.
    each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
        var method = ArrayProto[name];
        // 将 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift' 添加到wrapper的原型对象中
        wrapper.prototype[name] = function() {
            // _wrapped变量中存储Underscore对象的原始值
            var wrapped = this._wrapped;
            // 调用Array对应的方法并返回结果
            method.apply(wrapped, arguments);
            var length = wrapped.length;
            if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
            // 执行result()返回结果
            return result(wrapped, this._chain);
        };
    });

    // 作用同于上一段代码, 将数组中的一些方法添加到underscore对象, 并支持了方法链操作
    // 区别在于上一段代码所添加的函数, 均返回Array对象本身(也可能是封装后的Array), concat, join, slice方法将返回一个新的Array对象(也可能是封装后的Array)
    // Add all accessor Array functions to the wrapper.
    each(['concat', 'join', 'slice'], function(name) {
        var method = ArrayProto[name];

        wrapper.prototype[name] = function() {
            return result(method.apply(this._wrapped, arguments), this._chain);
        };
    });

    // 对underscore对象进行链式操作的声明方法
    // Start chaining a wrapped Underscore object.
    wrapper.prototype.chain = function() {
        this._chain = true; // 标示对象是否使用链式操作
        return this; // 返回一个underscore对象，原始数值存放在_wrapped属性中，可通过value()获取。
    };

    // 返回被封装的underscore对象的原始值(存放在_wrapped属性中)
    // Extracts the result from a wrapped and chained object.
    wrapper.prototype.value = function() {
        return this._wrapped;
    };

}).call(this);
