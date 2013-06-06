/*jslint white: true */
/**
 * Treevue is a jQuery plugin for accessible tree views. It uses wai-aria
 * for full feature support with modern screenreaders.
 * 
 * 
 */
(function($) {
    'use strict';
    
    var treeFallback, branchFallback,
        fallbackCss = {
            'position': 'absolute',
            'width': '0',
            'overflow': 'hidden'
        },  
        // ARIA-properties
        ariaExp     = 'data-aria-expanded',
        ariaSel     = 'data-aria-selected',
        ariaHide    = 'data-aria-hidden',
        // className values
        focusClass  = 'treevue-focus',
        expandedCls = 'treevue-expanded',
        collapseCls = 'treevue-collapsed',
        selectedCls = 'treevue-selected',
        // Text for i11n
        textExpanded = 'Expanded node',
        textCollapsed = 'Collapsed node',
        textTree    = 'Tree structure';
    
    // Set up nodes that work as fallbacks for AT that don't
    // support ARIA    
    treeFallback   = $('<span class="treevue_fallback">' + 
                      textTree + ', </span>').css(fallbackCss);
    branchFallback = $('<span class="treevue_fallback_branch">' +
                        textExpanded + ', </span>').css(fallbackCss);
    
    /**
     * Add ARIA roles
     */
    function addAriaTreeRoles(trees) {
        var collapsed,
            role = 'data-role';
        
        trees.find('li').attr( // define tree nodes
            role, 'treeitem'
        );
        trees.find('ul, ol').attr({ // define branches
            role: 'group'
        }).closest('li').attr(ariaExp, true).addClass(expandedCls).
                prepend(branchFallback);
        
        trees.attr(role, 'tree');
        
        // Collapse nodes nested within a list with aria-hidden
        collapsed = trees.find('ul[aria-hidden=true], ' +
                               'ol[aria-hidden=true]').closest('li');
        collapsed = collapsed.find('.' + expandedCls).andSelf();
        collapsed.attr(ariaExp, 'false');
        collapsed.removeClass(expandedCls).addClass(collapseCls);
        collapsed.find('ul, ol').attr(ariaHide, true).hide();
    }
    
    
    /**
     * Where checkboxes are included allow selection
     */
    function addAriaSelectStates(trees) {
        trees.find(':checkbox').each(function () {
            var $this = $(this).attr('tabindex', -1);
            if ($this.prop('checked')) {
                $this.addClass(selectedCls);
                $this.closest('li').attr(ariaSel, true);
            } else {
                $this.removeClass(selectedCls);
                $this.closest('li').attr(ariaSel, false);
            }
        
        }).closest('.treevue').attr('aria-multiselectable', true);
    }
    
    /**
     * TreeVue jQuery plugin; accessible treeview
     */
    $.fn.treevue = function() {
        var trees = $(this),
            first = trees.find('> :first-child');
        trees.addClass('treevue');
        trees.find('li').attr('tabindex', -1);
        
        
        // Add WAI-ARIA role and state
        addAriaTreeRoles(trees);
        addAriaSelectStates(trees);
        
        first.attr('tabindex', 0).addClass(focusClass)
        first.prepend(treeFallback);
    };
    
    // When the document is loaded, attach event handlers for all vuetrees 
    $(function () {
        /**
         * Toggle the visibility of the branch
         */
        function toggleBranch(branch) {
            var subtree = branch.find('ul, ol').first();
            if (branch.hasClass(expandedCls)) {
                branch.attr(ariaExp, false);
                branch.addClass(collapseCls).removeClass(expandedCls);
                subtree.hide(200).attr(ariaHide, true);
                branch.find('.treevue_fallback_branch').text(textCollapsed);
                
            } else {
                branch.attr(ariaExp, true);
                branch.addClass(expandedCls).removeClass(collapseCls);
                subtree.show(200).attr(ariaHide, false);
                branch.find('.treevue_fallback_branch').text(textExpanded);
            }
        }
        
        /**
         * Move the focus to an item in the tree.
         */
        function focusItem(elm) {
            var tree = elm.closest('.treevue');
            if (tree.length === 1) {
                tree.find('.' + focusClass).removeClass(focusClass).attr(
                        'tabindex', -1);
                elm.focus().attr('tabindex', 0);
                elm.addClass(focusClass);
                // Move the tree fallback
                tree.find('.treevue_fallback').detach().prependTo(elm);
            }
        }
    
        /**
         * When a checkbox is changed, update the aria-selected state.
         */
        function checkboxChange(box) {
            var item = box.closest('[aria-selected]'),
                checked = box.prop('checked'),
                node = box.closest('li');
            
            // update the selected state
            item.attr(ariaSel, checked);
            
            // select / unselect all children when the node is a subselector
            if (box.attr('data-type') === 'subselector') {
                node.find('ul :checkbox, ol :checkbox').prop('checked', checked);
            }
            
            // Locate any parent nodes
            node.parents('.treevue li').each(function () {
                var boxes,
                    $this = $(this),
                    checkbox = $(':checkbox', this).first();
                
                // check if the parents have a subselector
                if (checkbox.closest('li').is($this) &&
                        checkbox.attr('data-type') === 'subselector') {
                    
                    // All boxes are checked to check the subselector
                    boxes = $this.find('ul :checkbox, ol :checkbox');
                    if (boxes.length === boxes.filter(':checked').length) {
                        checkbox.prop('checked', true);
                        
                    // Subselector is unchecked
                    } else if (checked === false) {
                        checkbox.prop('checked', false);
                    }
                }
            });
            
        }
    
        /**
         * pointer input
         */
        $('body').on('click', '.treevue li.' + expandedCls +
                              ', .treevue li.' + collapseCls, function (event) {
            if (event.target === this) {
                var $this = $(this);
                event.preventDefault();
                toggleBranch($this);
                focusItem($this);
            }
        
        /**
         * Keep aria-selected state in sync with the checkbox
         */
        }).on('change', '.treevue :checkbox', function () {
            var $this = $(this);
            checkboxChange($this);
            focusItem($this.closest('li'));
        
        /**
         * keyboard input
         */
        }).on('keydown', '.treevue li', function (event) {
            var expanded, checkbox,
                keyCode = event.keyCode,
                $this = $(this);
            
            if (event.target !== this) {
                return;
            }
            expanded = $this.hasClass(expandedCls);
            
            // Press RETURN
            if (keyCode === 13 && $this.attr(ariaSel) !== undefined) {
                //locate the checkbox and invert it and the select value
                checkbox = $this.find(':checkbox').first();
                checkbox.prop('checked', !checkbox.prop('checked'));
                checkboxChange(checkbox);
                
            } else if (keyCode === 40) { // press DOWN
                if (expanded) { // enter a branch
                    focusItem($this.find('ul li, ol li').first());
                } else if ($this.next().length === 0) { // exit a branch
                    focusItem($this.parent().closest('li').next());
                } else { // next sibling
                    focusItem($this.next());
                }
                
            } else if (keyCode === 38) { // press UP
                if ($this.prev().hasClass(expandedCls)) { // enter a branch
                    focusItem($this.prev().find('ul li, ol li').last());
                } else if ($this.prev().length === 0) { // exit a branch
                    focusItem($this.parent().closest('li'));
                } else { // prev sibling
                    focusItem($this.prev());
                }
                
            } else if (keyCode === 37) { // press LEFT
                if (expanded) {
                    toggleBranch($this);
                } else { // exit the current branch
                    focusItem($this.parent().closest('li'));
                }
                
            } else if (keyCode === 39) { // press RIGHT
                if ($this.hasClass(collapseCls)) {
                    toggleBranch($this);
                } else if (expanded) { // enter a branch
                    focusItem($this.find('ul li, ol li').first());
                }
            
            } else { // no known keys activated, so nothing has to be prevented
                return;
            }
            
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
    });
    
}(jQuery));