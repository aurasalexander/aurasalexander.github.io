(function($, window, document, undefined) {
    var pluginName = "ptrLight",
        defaults = {
            paused: false,
            pullThreshold: 200,
            maxPullThreshold: 500,
            spinnerTimeout: 10000,
            scrollingDom: null, // if null, specified element
            refresh: function() {}
        };

    function Plugin(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }
    Plugin.prototype = {
        init: function() {
            var self = this;
            var elem = $(self.element).children();
            self.elem = elem;
            elem.parent().find('#ptr-light-indicator').remove();
            elem.parent().prepend('<div id="ptr-light-indicator"><div id="ptr-light-spinner"></div></div>');
            self.indicator = elem.parent().find('#ptr-light-indicator');
            self.spinner = elem.parent().find('#ptr-light-spinner');
            self.indicatorHeight = self.indicator.outerHeight();
            $(elem).css({
                'transform': "translateY(-" + self.indicatorHeight + "px)"
            });
            elem.parent().css({
                '-webkit-overflow-scrolling': 'touch'
            });
            var offsetTop = elem.parent().offset().top;
            var fingerOffset = 0;
            var top = 0;
            self.isSpinning = false;
            self.elast = true;
            self.windowDimension = elem.parent().outerHeight();
            self.getTopTranslation = function(top) {
                return (1.0 - (1.0 / ((top * 0.55 / self.windowDimension) + 1.0))) * self.windowDimension;
            }
            self.spinner.css('opacity', '0');
            elem.unbind('touchstart.' + pluginName);
            elem.on('touchstart.' + pluginName, function(ev) {
                if (self.options.paused)
                    return false;
                fingerOffset = ev.originalEvent.touches[0].pageY - offsetTop
            });
            elem.unbind('touchmove.' + pluginName);
            elem.on('touchmove.' + pluginName, function(ev) {
                if (self.options.paused)
                    return false;

                if (elem.position().top < 0 || (self.options.scrollingDom || elem.parent()).scrollTop() > 0 || document.body.scrollTop > 0) { // trigger refresh only if pulled from the top of the list
                    self.spinner.css('opacity', '0');
                    return true;
                }
                self.spinner.css('opacity', '1');

                top = (ev.originalEvent.touches[0].pageY - offsetTop - fingerOffset);
                if (top > 1) {
                    if (self.elast) {
                        $(document.body).on('touchmove.' + pluginName, function(e) {
                            e.preventDefault();
                        });
                        self.elast = false;
                    }

                    if (top <= self.options.maxPullThreshold) {
                        var topTranslation = self.getTopTranslation(top);
                        $(elem).css({
                            'transform': "translateY(" + (topTranslation - self.indicatorHeight) + "px)"
                        });

                        self.indicator.css({
                            'top': (topTranslation - self.indicatorHeight) + "px"
                        });
                    }

                      var rotation = 360 * (top / self.options.pullThreshold);
                      rotation = rotation > 360 ? 360 : parseInt(rotation,10);
                      self.spinner.css({'transform': 'rotate('+ rotation +'deg)'});
                } else {
                    $(document.body).unbind('touchmove.' + pluginName);
                    self.elast = true;
                }
            });
            elem.unbind('touchend.' + pluginName);
            elem.on('touchend.' + pluginName, function(ev) {
                if (self.options.paused)
                    return false;

                if (top > 0) {
                    if (top > self.options.pullThreshold) {
                        self.options.refresh.call(this, self);
                        self.spinner.addClass('rotateLoop');
                        self.isSpinning = true;
                        elem.css({
                            'transform': 'translateY(0)',
                            'transition': 'transform 300ms ease'
                        });
                        self.indicator.css({
                            'top': "0px",
                            'transition': 'top 300ms ease'
                        });
                        if (self.options.spinnerTimeout) {
                            setTimeout(function() {
                                self.done();
                            }, self.options.spinnerTimeout);
                        }

                    } else {
                        self.indicator.css({
                            'top': "-" + self.indicatorHeight + "px",
                            'transition': 'top 300ms ease'
                        });
                        elem.css({
                            'transform': 'translateY(-' + self.indicatorHeight + 'px)',
                            'transition': 'transform 300ms ease'
                        });
                    }
                    top = 0;
                }
                setTimeout(function() {
                    elem.css({
                        'transition': ''
                    });
                    self.indicator.css({
                        'transition': ''
                    });
                    $(document.body).unbind('touchmove.' + pluginName);
                    self.elast = true;
                }, 300);
            });
        },
        done: function() {
            var self = this;
            var elem = self.elem;
            self.indicator.css({
                'top': "-" + self.indicatorHeight + "px",
                'transition': 'top 300ms ease'
            });
            elem.css({
                'transform': 'translateY(-' + self.indicatorHeight + 'px)',
                'transition': 'transform 300ms ease'
            });
            setTimeout(function() {
                self.spinner.removeClass('rotateLoop');
                self.isSpinning = false;
                self.spinner.css('opacity', '0');
                elem.css({
                    'transition': ''
                });
                self.indicator.css({
                    'transition': ''
                });
                $(document.body).unbind('touchmove.' + pluginName);
                self.elast = true;
            }, 300);
        }
    };
    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
