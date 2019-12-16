
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function (exports) {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement !== 'undefined') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set() {
                // overridden by instance, if it has props
            }
        };
    }

    const FileViewer = (url, filename) => {
        const fileExtension = getFileExtensionByTitle(filename);

        switch (fileExtension) {
            case "png":
            case "jpg":
            case "jpeg":
            case "gif":
            case "pdf":
                return url;

            case "xlsx":
                return `https://view.officeapps.live.com/op/embed.aspx?src=${decodeURIComponent(
                url
            )}`;
            default:
                return "not supported";
        }
    };

    const getFileExtensionByTitle = filename => {
        return !!filename
            ? filename
                  .split(".")
                  .pop()
                  .toLowerCase()
            : null;
    };

    /* src/FileViewer.svelte generated by Svelte v3.6.10 */

    const file = "src/FileViewer.svelte";

    // (42:0) {:else}
    function create_else_block(ctx) {
    	var slot;

    	return {
    		c: function create() {
    			slot = element("slot");
    			slot.textContent = "File extension is not supported.";
    			attr(slot, "name", "not-supported");
    			add_location(slot, file, 42, 5, 1065);
    		},

    		m: function mount(target, anchor) {
    			insert(target, slot, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(slot);
    			}
    		}
    	};
    }

    // (38:0) {#if !isNil(formattedUrl) && !isNil(fileTypeSupported) && fileTypeSupported}
    function create_if_block(ctx) {
    	var div, iframe, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			attr(iframe, "title", ctx.filename);
    			attr(iframe, "src", ctx.formattedUrl);
    			attr(iframe, "frameborder", "0");
    			add_location(iframe, file, 39, 8, 946);
    			attr(div, "class", "file-view-iframe-conatiner");
    			add_location(div, file, 38, 4, 897);
    			dispose = listen(iframe, "load", dispatchOnLoad);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, iframe);
    		},

    		p: function update(changed, ctx) {
    			if (changed.filename) {
    				attr(iframe, "title", ctx.filename);
    			}

    			if (changed.formattedUrl) {
    				attr(iframe, "src", ctx.formattedUrl);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	var if_block_anchor;

    	function select_block_type(ctx) {
    		if (!isNil(ctx.formattedUrl) && !isNil(ctx.fileTypeSupported) && ctx.fileTypeSupported) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    			this.c = noop;
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function isNil(obj) {
        return obj === undefined || obj === null;
    }

    function dispatchOnLoad(e) {
        const event = new CustomEvent("onload", {
            detail: `file viewer on load`,
            bubbles: true,
            cancelable: true,
            composed: true
        });

        this.dispatchEvent(event);
    }

    function instance($$self, $$props, $$invalidate) {
    	

        let { url = null, filename = null } = $$props;

        let formattedUrl;
        let fileTypeSupported;

        onMount(() => {
            setTimeout(() => { // svelte's bug
                $$invalidate('formattedUrl', formattedUrl = FileViewer(url, filename));

                $$invalidate('fileTypeSupported', fileTypeSupported = formattedUrl !== "not supported");
            }, 0);
        });

    	const writable_props = ['url', 'filename'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<file-viewer> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('url' in $$props) $$invalidate('url', url = $$props.url);
    		if ('filename' in $$props) $$invalidate('filename', filename = $$props.filename);
    	};

    	return {
    		url,
    		filename,
    		formattedUrl,
    		fileTypeSupported
    	};
    }

    class FileViewer_1 extends SvelteElement {
    	constructor(options) {
    		super();

    		this.shadowRoot.innerHTML = `<style>.file-view-iframe-conatiner,iframe{height:100%;width:100%}
		/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmlsZVZpZXdlci5zdmVsdGUiLCJzb3VyY2VzIjpbIkZpbGVWaWV3ZXIuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdmVsdGU6b3B0aW9ucyB0YWc9XCJmaWxlLXZpZXdlclwiIC8+XG5cbjxzY3JpcHQ+XG4gICAgaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gXCJzdmVsdGVcIjtcbiAgICBpbXBvcnQgeyBGaWxlVmlld2VyIH0gZnJvbSBcIi4vdXRpbHMvZmlsZS12aWV3ZXJcIjtcblxuICAgIGV4cG9ydCBsZXQgdXJsID0gbnVsbDtcbiAgICBleHBvcnQgbGV0IGZpbGVuYW1lID0gbnVsbDtcblxuICAgIGxldCBmb3JtYXR0ZWRVcmxcbiAgICBsZXQgZmlsZVR5cGVTdXBwb3J0ZWQ7XG5cbiAgICBvbk1vdW50KCgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7IC8vIHN2ZWx0ZSdzIGJ1Z1xuICAgICAgICAgICAgZm9ybWF0dGVkVXJsID0gRmlsZVZpZXdlcih1cmwsIGZpbGVuYW1lKTtcblxuICAgICAgICAgICAgZmlsZVR5cGVTdXBwb3J0ZWQgPSBmb3JtYXR0ZWRVcmwgIT09IFwibm90IHN1cHBvcnRlZFwiO1xuICAgICAgICB9LCAwKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGlzTmlsKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqID09PSB1bmRlZmluZWQgfHwgb2JqID09PSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoT25Mb2FkKGUpIHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoXCJvbmxvYWRcIiwge1xuICAgICAgICAgICAgZGV0YWlsOiBgZmlsZSB2aWV3ZXIgb24gbG9hZGAsXG4gICAgICAgICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbXBvc2VkOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgfVxuPC9zY3JpcHQ+XG5cblxueyNpZiAhaXNOaWwoZm9ybWF0dGVkVXJsKSAmJiAhaXNOaWwoZmlsZVR5cGVTdXBwb3J0ZWQpICYmIGZpbGVUeXBlU3VwcG9ydGVkfVxuICAgIDxkaXYgY2xhc3M9XCJmaWxlLXZpZXctaWZyYW1lLWNvbmF0aW5lclwiPlxuICAgICAgICA8aWZyYW1lIHRpdGxlPXtmaWxlbmFtZX0gc3JjPXtmb3JtYXR0ZWRVcmx9IG9uOmxvYWQ9e2Rpc3BhdGNoT25Mb2FkfSBmcmFtZWJvcmRlcj1cIjBcIj48L2lmcmFtZT5cbiAgICA8L2Rpdj5cbns6ZWxzZX1cbiAgICAgPHNsb3QgbmFtZT1cIm5vdC1zdXBwb3J0ZWRcIj5cbiAgICAgICAgRmlsZSBleHRlbnNpb24gaXMgbm90IHN1cHBvcnRlZC5cbiAgICAgPC9zbG90Plxuey9pZn1cblxuPHN0eWxlPlxuICAgIC5maWxlLXZpZXctaWZyYW1lLWNvbmF0aW5lciwgaWZyYW1lIHtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWdESSwyQkFBMkIsQ0FBRSxNQUFNLEFBQUMsQ0FBQyxBQUNqQyxNQUFNLENBQUUsSUFBSSxDQUNaLEtBQUssQ0FBRSxJQUFJLEFBQ2YsQ0FBQyJ9 */</style>`;

    		init(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, ["url", "filename"]);

    		if (options) {
    			if (options.target) {
    				insert(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["url","filename"];
    	}

    	get url() {
    		return this.$$.ctx.url;
    	}

    	set url(url) {
    		this.$set({ url });
    		flush();
    	}

    	get filename() {
    		return this.$$.ctx.filename;
    	}

    	set filename(filename) {
    		this.$set({ filename });
    		flush();
    	}
    }

    customElements.define("file-viewer", FileViewer_1);

    exports.App = FileViewer_1;

    return exports;

}({}));
//# sourceMappingURL=bundle.js.map
