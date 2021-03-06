'use strict';

import { newCreateHref } from './create-href';

var debug = 0 ? console.log.bind(console, '[breadcrumbs]') : function() {};

export function newBreadcrumbsController(searchConfig) {
	if (!searchConfig) {
		throw 'newBreadcrumbsController: must provide searchConfig';
	}
	const hrefFactory = newCreateHref(searchConfig);

	return {
		data: {
			sectionsMeta: null,
			breadcrumbs: {
				sections: [],
				page: {}
			}
		},
		breadCrumbsCreated: false,
		receiveData: function(data) {
			debug('receiveData', data);
			this.data.sectionsMeta = data.metaSearch;
			this.createBreadcrumbs();
		},

		receivePageInfo: function(page) {
			debug('receivePageInfo', page);
			this.data.breadcrumbs.page = page;
			this.createBreadcrumbs();
		},

		onTurbolinksBeforeRender: function() {
			debug('onTurbolinksBeforeRender');
			this.breadCrumbsCreated = false;
			this.data.breadcrumbs.page = {};
			this.data.breadcrumbs.sections.length = 0;
		},

		createBreadcrumbs: function() {
			if (this.breadCrumbsCreated) {
				return;
			}

			debug('createBreadcrumbs', this.data);

			if (
				!this.data.sectionsMeta ||
				!this.data.breadcrumbs.page ||
				this.data.breadcrumbs.page.type === 'content'
			) {
				// Wait for the real data to arrive.
				return;
			}

			this.breadCrumbsCreated = true;

			let breadcrumbs = this.data.breadcrumbs;
			let pageType = this.data.breadcrumbs.page.type;
			let isStatic = pageType != 'content' && pageType != 'sections' && pageType != 'wpArticle';

			// Pages powered by Hugo
			if (isStatic) {
				let parts = breadcrumbs.page.sectionsEntries;
				breadcrumbs.sections = this.assembleSections(parts);

				return;
			}

			// Articles hosted on WordPress
			if (pageType == 'wpArticle') {
				console.log(breadcrumbs.page.section);
				let parts = breadcrumbs.page.section.split(' > ');
				breadcrumbs.sections = this.assembleSections(parts);
				return;
			}

			// Category listings.
			let parts = hrefFactory.sectionsFromPath();
			let sections = this.assembleSections(parts);
			breadcrumbs.sections = sections;
		},

		assembleSections: function(parts) {
			if (!parts || !this.data.sectionsMeta) {
				return [];
			}
			let sections = [];
			let sectionKeys = [];
			for (let section of parts) {
				sectionKeys.push(section.toLowerCase());
				let key = sectionKeys.join(' > ');
				let sm = this.data.sectionsMeta.getSectionMeta(key);
				if (sm) {
					sections.push(sm);
				} else {
					// This will be WordPress content when no Algolia data has been loaded.
					// But these sections are already ready to be presented as a title.
					sections.push({
						href: hrefFactory.hrefSection(key),
						linkTitle: section
					});
				}
			}

			return sections;
		}
	};
}
