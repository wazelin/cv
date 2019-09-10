const autoprefixer = require('gulp-autoprefixer'),
	browserSync = require('browser-sync'),
	cache = require('gulp-cache'),
	cssnano = require('gulp-cssnano'),
	del = require('del'),
	fs = require('fs'),
	gulp = require('gulp'),
	gulpIf = require('gulp-if'),
	imagemin = require('gulp-imagemin'),
	path = require('path'),
	plumber = require('gulp-plumber'),
	realFavicon = require('gulp-real-favicon'),
	refHash = require('gulp-ref-hash'),
	replace = require('gulp-replace'),
	sass = require('gulp-sass'),
	uglify = require('gulp-uglify'),
	useref = require('gulp-useref'),
	watchSass = require('gulp-watch-sass'),
	wkhtmltopdf = require('wkhtmltopdf');

const FAVICON_DATA_FILE = 'faviconData.json';

gulp.task(
	'browser-sync',
	function () {
		browserSync({
			server : {
				baseDir : './src'
			}
		})
	}
);

gulp.task(
	'sass',
	function () {
		return gulp.src('./src/scss/**/*.scss')
			.pipe(sass().on('error', sass.logError))
			.pipe(autoprefixer({cascade : false}))
			.pipe(gulp.dest('./src/css'));
	}
);

gulp.task(
	'vendor',
	function () {
		return gulp
			.src(
				[
					'./node_modules/jquery/dist/jquery.js',
					'./node_modules/tether/dist/js/tether.js',
					'./node_modules/bootstrap/dist/js/bootstrap.bundle.js'
				]
			)
			.pipe(gulp.dest('./src/vendor'))
			.pipe(browserSync.stream());
	}
);

gulp.task(
	'vendor:public',
	function () {
		return gulp.src('./node_modules/font-awesome/fonts/*')
			.pipe(gulp.dest('./src/vendor/public'));
	}
);

gulp.task(
	'prepareHtmlForPdfExport',
	function () {
		return gulp
			.src('./src/index.html')
			.pipe(
				replace(/src="([^"]+(?:\.png|\.jpg|\.gif|\.svg))"/g, 'src="file:///' + path.resolve('./src') + '/$1"')
			)
			.pipe(replace(/^.*class="legend.*$|^.*rel="stylesheet".*$|^.*<script\s.*$|Download this CV/gm, ''))
			.pipe(gulp.dest('./src/vendor'));
	}
);

gulp.task(
	'wkhtmltopdf',
	function () {
		return wkhtmltopdf(
			'file://' + path.resolve('./src/vendor/index.html'),
			{output : path.resolve('./src/vendor/public/cv.pdf')}
		);
	}
);

gulp.task('pdf', gulp.series('prepareHtmlForPdfExport', 'wkhtmltopdf'));

gulp.task(
	'images',
	function () {
		return gulp.src('src/images/**/*.+(png|jpg|gif|svg)')
			.pipe(cache(imagemin()))
			.pipe(gulp.dest('dist/images'));
	}
);

gulp.task(
	'useref',
	function () {
		return gulp.src('./src/*.html')
			.pipe(
				refHash(
					{
						paths : {
							js  : './js/',
							css : './css/'
						}
					}
				)
			)
			.pipe(useref())
			.pipe(gulpIf('*.js', uglify()))
			.pipe(gulpIf('*.css', cssnano()))
			.pipe(gulp.dest('./dist'));
	}
);

gulp.task(
	'generate-favicon',
	function (done) {
		realFavicon.generateFavicon({
			masterPicture : './src/logo.png',
			dest          : './dist',
			iconsPath     : '.',
			design        : {
				ios             : {
					pictureAspect   : 'backgroundAndMargin',
					backgroundColor : '#ffffff',
					margin          : '14%',
					assets          : {
						ios6AndPriorIcons      : false,
						ios7AndLaterIcons      : false,
						precomposedIcons       : false,
						declareOnlyDefaultIcon : true
					}
				},
				desktopBrowser  : {},
				windows         : {
					pictureAspect   : 'noChange',
					backgroundColor : '#da532c',
					onConflict      : 'override',
					assets          : {
						windows80Ie10Tile      : false,
						windows10Ie11EdgeTiles : {
							small     : false,
							medium    : true,
							big       : false,
							rectangle : false
						}
					}
				},
				androidChrome   : {
					pictureAspect : 'noChange',
					themeColor    : '#ffffff',
					manifest      : {
						display     : 'standalone',
						orientation : 'notSet',
						onConflict  : 'override',
						declared    : true
					},
					assets        : {
						legacyIcon         : false,
						lowResolutionIcons : false
					}
				},
				safariPinnedTab : {
					pictureAspect : 'silhouette',
					themeColor    : '#5bbad5'
				}
			},
			settings      : {
				scalingAlgorithm     : 'Mitchell',
				errorOnImageTooSmall : false
			},
			markupFile    : FAVICON_DATA_FILE
		}, function () {
			done();
		});
	}
);

gulp.task(
	'inject-favicon-markups',
	function () {
		return gulp.src(['./dist/*.html'])
			.pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
			.pipe(gulp.dest('./dist'));
	}
);

gulp.task(
	'watch',
	function () {
		watchSass('./src/scss/**/*.scss')
			.pipe(plumber())
			.pipe(sass())
			.pipe(gulp.dest('./src/css'))
			.pipe(browserSync.reload({stream : true}));
		gulp.watch(['./src/*.html', './src/js/**/*.js', './src/images/**/*.+(png|jpg|gif|svg)'], browserSync.reload);
	}
);

gulp.task(
	'clean',
	function () {
		return del([FAVICON_DATA_FILE]);
	}
);

gulp.task('build', gulp.series(gulp.parallel('vendor', 'vendor:public'), gulp.parallel('sass', 'pdf'), 'clean'));

gulp.task('serve', gulp.series('build', 'browser-sync', 'watch'));

gulp.task(
	'publish:vendor',
	function () {
		return gulp.src('./src/vendor/public/**/*')
			.pipe(gulp.dest('./dist/vendor/public'));
	}
);

gulp.task(
	'publish',
	gulp.series(
		'build',
		gulp.parallel('useref', 'publish:vendor'),
	)
);

gulp.task(
	'default',
	gulp.series(
		gulp.parallel(
			'generate-favicon',
			'publish',
			'images'
		),
		'inject-favicon-markups',
	)
);
