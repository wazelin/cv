const gulp = require('gulp'),
    sass = require('gulp-sass'),
    watchSass = require('gulp-watch-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    plumber = require('gulp-plumber'),
    browserSync = require('browser-sync'),
    useref = require('gulp-useref'),
    refHash = require('gulp-ref-hash'),
    uglify = require('gulp-uglify'),
    gulpIf = require('gulp-if'),
    cssnano = require('gulp-cssnano'),
    imagemin = require('gulp-imagemin'),
    runSequence = require('run-sequence'),
    cache = require('gulp-cache'),
    realFavicon = require('gulp-real-favicon'),
    html2pdf = require('gulp-html2pdf'),
    fs = require('fs');

const FAVICON_DATA_FILE = 'faviconData.json';

gulp.task(
    'browser-sync',
    function () {
        browserSync({
            server: {
                baseDir: './src'
            }
        })
    }
);

gulp.task(
    'sass',
    function () {
        return gulp.src('./src/scss/**/*.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(autoprefixer({browsers: ['last 2 versions'], cascade: false}))
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
    'html2pdf',
    function () {
        return gulp
            .src('./src/index.html')
            .pipe(plumber())
            .pipe(html2pdf())
            .pipe(gulp.dest('./src/vendor/public'));
    }
);

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
                        paths: {
                            js: './js/',
                            css: './css/'
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
            masterPicture: './src/logo.png',
            dest: './dist',
            iconsPath: '.',
            design: {
                ios: {
                    pictureAspect: 'backgroundAndMargin',
                    backgroundColor: '#ffffff',
                    margin: '14%',
                    assets: {
                        ios6AndPriorIcons: false,
                        ios7AndLaterIcons: false,
                        precomposedIcons: false,
                        declareOnlyDefaultIcon: true
                    }
                },
                desktopBrowser: {},
                windows: {
                    pictureAspect: 'noChange',
                    backgroundColor: '#da532c',
                    onConflict: 'override',
                    assets: {
                        windows80Ie10Tile: false,
                        windows10Ie11EdgeTiles: {
                            small: false,
                            medium: true,
                            big: false,
                            rectangle: false
                        }
                    }
                },
                androidChrome: {
                    pictureAspect: 'noChange',
                    themeColor: '#ffffff',
                    manifest: {
                        display: 'standalone',
                        orientation: 'notSet',
                        onConflict: 'override',
                        declared: true
                    },
                    assets: {
                        legacyIcon: false,
                        lowResolutionIcons: false
                    }
                },
                safariPinnedTab: {
                    pictureAspect: 'silhouette',
                    themeColor: '#5bbad5'
                }
            },
            settings: {
                scalingAlgorithm: 'Mitchell',
                errorOnImageTooSmall: false
            },
            markupFile: FAVICON_DATA_FILE
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
            .pipe(browserSync.reload({stream: true}));
        gulp.watch(['./src/*.html', './src/js/**/*.js', './src/images/**/*.+(png|jpg|gif|svg)'], browserSync.reload);
    }
);

gulp.task(
    'serve',
    function (done) {
        runSequence(
            'build',
            'browser-sync',
            'watch',
            done
        );
    }
);

gulp.task('build', ['vendor', 'vendor:public', 'sass', 'html2pdf']);

gulp.task(
    'publish',
    function (done) {
        runSequence(
            'build',
            ['useref', 'publish:vendor'],
            done
        );
    }
);

gulp.task(
    'publish:vendor',
    function () {
        return gulp.src('./src/vendor/public/**/*')
            .pipe(gulp.dest('./dist/vendor/public'));
    }
);

gulp.task(
    'default',
    function (done) {
        runSequence(
            [
                'generate-favicon',
                'publish',
                'images'
            ],
            'inject-favicon-markups',
            done
        );
    }
);
