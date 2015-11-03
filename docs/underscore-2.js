/*
*   Parsing the Source Codes by han.chen
*   Version: 1.3.3
*   Data: 2015/11/3
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

    // 集合方法
    // Collection Functions
    // --------------------

    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles objects with the built-in `forEach`, arrays, and raw objects.
    // Delegates to **ECMAScript 5**'s native `forEach` if available.
    var each = _.each = _.forEach = function (obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
            // 浏览器支持原生forEach则调用该方法
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            // obj.length === +obj.length 判断是否为数组，同时也可以判断字符串（obj有length属性并且obj.length为number）
            // 对数组遍历执行方法
            for (var i = 0, l = obj.length; i < l; i++) {
                // 将iterator绑到context上 参数为obj[i], i, obj
                if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
            }
        } else {
            // 对对象遍历执行方法
            for (var key in obj) {
                if (_.has(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) return;
                }
            }
        }
    };

    // Return the results of applying the iterator to each element.
    // Delegates to **ECMAScript 5**'s native `map` if available.
    _.map = _.collect = function (obj, iterator, context) {
        // 存放返回的数组
        var results = [];
        if (obj == null) return results;
        // 优先调用原生map
        if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
        each(obj, function (value, index, list) {
            // results[results.length] => results.length ++
            // 此处亮点O(∩_∩)O~
            results[results.length] = iterator.call(context, value, index, list);
        });
        if (obj.length === +obj.length) results.length = obj.length;
        // 返回结果
        return results;
    };

    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
    _.reduce = _.foldl = _.inject = function (obj, iterator, memo, context) {
        // 判断是否有初始值memo
        var initial = arguments.length > 2;
        if (obj == null) obj = [];
        // 优先调用原生reduce
        if (nativeReduce && obj.reduce === nativeReduce) {
            if (context) iterator = _.bind(iterator, context);
            return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
        }
        each(obj, function (value, index, list) {
            if (!initial) {
                // 如果没有初始值, 则将第一个元素作为初始值; 如果被处理的是对象集合, 则默认值为第一个属性的值
                memo = value;
                initial = true;
            } else {
                // 变量memo保存结果并进行下一次迭代
                memo = iterator.call(context, memo, value, index, list);
            }
        });
        if (!initial) throw new TypeError('Reduce of empty array with no initial value');
        return memo;
    };

    // The right-associative version of reduce, also known as `foldr`.
    // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
    _.reduceRight = _.foldr = function (obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (obj == null) obj = [];
        // 优先调用原生reduceRight
        if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
            if (context) iterator = _.bind(iterator, context);
            return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
        }
        // 对集合进行倒序处理
        var reversed = _.toArray(obj).reverse();
        if (context && !initial) iterator = _.bind(iterator, context);
        // 倒序之后调用reduce方法
        return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
    };

    // Return the first value which passes a truth test. Aliased as `detect`.
    _.find = _.detect = function (obj, iterator, context) {
        // result存放第一个通过验证的元素
        var result;
        // 通过any遍历obj
        any(obj, function (value, index, list) {
            // 如果返回值为true，则把值传递给result
            if (iterator.call(context, value, index, list)) {
                result = value;
                return true;
            }
        });
        return result;
    };

    // Return all the elements that pass a truth test.
    // Delegates to **ECMAScript 5**'s native `filter` if available.
    // Aliased as `select`.
    _.filter = _.select = function (obj, iterator, context) {
        // 存储通过验证的元素数组
        var results = [];
        if (obj == null) return results;
        // 优先调用原生filter
        if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
        each(obj, function (value, index, list) {
            // 将通过验证的值赋给数组results
            if (iterator.call(context, value, index, list)) results[results.length] = value;
        });
        return results;
    };

    // Return all the elements for which a truth test fails.
    _.reject = function (obj, iterator, context) {
        // 与filter相反
        var results = [];
        if (obj == null) return results;
        each(obj, function (value, index, list) {
            if (!iterator.call(context, value, index, list)) results[results.length] = value;
        });
        return results;
    };

    // Determine whether all of the elements match a truth test.
    // Delegates to **ECMAScript 5**'s native `every` if available.
    // Aliased as `all`.
    _.every = _.all = function (obj, iterator, context) {
        var result = true;
        if (obj == null) return result;
        // 优先调用原生every
        if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
        each(obj, function (value, index, list) {
            // 该句意为当result被赋值为false之后，再次调用result && xxx结果都会为false
            // 此处亮点O(∩_∩)O~
            if (!(result = result && iterator.call(context, value, index, list))) return breaker;
        });
        return !!result;
    };

    // Determine if at least one element in the object matches a truth test.
    // Delegates to **ECMAScript 5**'s native `some` if available.
    // Aliased as `any`.
    var any = _.some = _.any = function (obj, iterator, context) {
        // 如果没有指定iterator, 则使用默认的处理器函数_.identity，该函数会返回参数本身
        iterator || (iterator = _.identity);
        var result = false;
        if (obj == null) return result;
        // 优先调用原生some
        if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
        each(obj, function (value, index, list) {
            // 调用||，有true则循环也将返回true
            // 此处亮点O(∩_∩)O~
            if (result || (result = iterator.call(context, value, index, list))) return breaker;
        });
        return !!result;
    };

    // Determine if a given value is included in the array or object using `===`.
    // Aliased as `contains`.
    _.include = _.contains = function (obj, target) {
        var found = false;
        if (obj == null) return found;
        // 优先调用原生indexOf
        if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
        // 如果obj里有任何一个元素等于给定值target则返回true，同时赋值给found
        found = any(obj, function (value) {
            return value === target;
        });
        return found;
    };

    // Invoke a method (with arguments) on every item in a collection.
    _.invoke = function (obj, method) {
        // 截获从第2个参数开始以后的参数，传递给method方法中作为参数
        var args = slice.call(arguments, 2);
        // 依次调用每个元素的方法，并将结果放入数组中返回
        return _.map(obj, function (value) {
            // 如果method为function则执行method，为字符串则执行value[method]
            return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
        });
    };

    // Convenience version of a common use case of `map`: fetching a property.
    _.pluck = function (obj, key) {
        // 调用map 返回obj[value][key]
        return _.map(obj, function (value) {
            return value[key];
        });
    };

    // Return the maximum element or (element-based computation).
    _.max = function (obj, iterator, context) {
        // 没有iterator并且obj为数组
        if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
        // 没有iterator并且obj为空值
        if (!iterator && _.isEmpty(obj)) return -Infinity;
        // result.computed在遍历过程中存储最大值 最大值得obj为result.value
        var result = {computed: -Infinity};
        each(obj, function (value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            // 如果比较值相比上一个值要大, 则将当前值放入result.value
            // 此处亮点O(∩_∩)O~
            computed >= result.computed && (result = {value: value, computed: computed});
        });
        return result.value;
    };

    // Return the minimum element (or element-based computation).
    _.min = function (obj, iterator, context) {
        // 与_.max相反
        if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
        if (!iterator && _.isEmpty(obj)) return Infinity;
        var result = {computed: Infinity};
        each(obj, function (value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            computed < result.computed && (result = {value: value, computed: computed});
        });
        return result.value;
    };

    // Shuffle an array.
    _.shuffle = function (obj) {
        var shuffled = [], rand;
        each(obj, function (value, index, list) {
            // 聪明...O(∩_∩)O~
            // 生成一个随机数, 随机数在<0-index>之间
            rand = Math.floor(Math.random() * (index + 1));
            // 将已经随机得到的元素放到shuffled数组末尾
            shuffled[index] = shuffled[rand];
            // 在前面得到的随机数的位置插入最新值value
            shuffled[rand] = value;
        });
        return shuffled;
    };

    // Sort the object's values by a criterion produced by an iterator.
    _.sortBy = function (obj, val, context) {
        // 如果有val方法则执行val，否则创建一个方法返回对象上的方法
        var iterator = _.isFunction(val) ? val : function (obj) {
            return obj[val];
        };
        // return _.pluck(_.map().sort(), 'value');
        // 调用_.map()方法遍历集合, 并将集合中的元素放到value节点, 将元素中需要进行比较的数据放到criteria属性中
        // 调用sort()方法将集合中的元素按照criteria属性中的数据进行顺序排序
        // 调用pluck获取排序后的对象集合并返回
        return _.pluck(_.map(obj, function (value, index, list) {
            return {
                value: value,
                criteria: iterator.call(context, value, index, list)
            };
        }).sort(function (left, right) {
            var a = left.criteria, b = right.criteria;
            if (a === void 0) return 1;
            if (b === void 0) return -1;
            // 比较a和b返回1, 0, -1
            return a < b ? -1 : a > b ? 1 : 0;
        }), 'value');
    };

    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    _.groupBy = function (obj, val) {
        var result = {};
        var iterator = _.isFunction(val) ? val : function (obj) {
            return obj[val];
        };
        each(obj, function (value, index) {
            var key = iterator(value, index);
            // 将处理器的返回值作为key, 并将相同的key元素放到一个新的数组
            (result[key] || (result[key] = [])).push(value);
        });
        return result;
    };

    // Use a comparator function to figure out at what index an object should
    // be inserted so as to maintain order. Uses binary search.
    _.sortedIndex = function (array, obj, iterator) {
        // _.identity返回参数本身
        iterator || (iterator = _.identity);
        var low = 0, high = array.length;
        // ***二分法查找***
        // 碉堡了有木有
        while (low < high) {
            var mid = (low + high) >> 1;
            iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
        }
        // 返回obj插入array之后的索引号
        return low;
    };

    // Safely convert anything iterable into a real, live array.
    _.toArray = function (obj) {
        if (!obj)                                     return [];
        if (_.isArray(obj))                           return slice.call(obj);
        // 将arguments转换为数组
        if (_.isArguments(obj))                       return slice.call(obj);
        // 调用原生toArray方法
        if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
        return _.values(obj);
    };

    // Return the number of elements in an object.
    _.size = function (obj) {
        // _.keys(obj).length为对象中的属性数量(不包含对象原型链中的属性)
        return _.isArray(obj) ? obj.length : _.keys(obj).length;
    };


    // ---------------




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