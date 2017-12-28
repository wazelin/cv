const gulp = require('gulp'),
    sass = require('gulp-sass'),
    browserSync = require('browser-sync'),
    useref = require('gulp-useref'),
    uglify = require('gulp-uglify'),
    gulpIf = require('gulp-if'),
    cssnano = require('gulp-cssnano'),
    runSequence = require('run-sequence'),
    realFavicon = require('gulp-real-favicon'),
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
        return gulp.src(['./node_modules/bootstrap/scss/bootstrap.scss', './src/scss/**/*.scss'])
            .pipe(sass().on('error', sass.logError))
            .pipe(gulp.dest('./src/css'))
            .pipe(browserSync.reload({stream: true}));
    }
);

gulp.task(
    'vendor', function () {
        return gulp
            .src(
                [
                    './node_modules/jquery/dist/jquery.slim.js',
                    './node_modules/tether/dist/js/tether.js',
                    './node_modules/bootstrap/dist/js/bootstrap.bundle.js'
                ]
            )
            .pipe(gulp.dest('./src/vendor'))
            .pipe(browserSync.stream());
    }
);

gulp.task(
    'useref',
    function () {
        return gulp.src('./src/*.html')
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
        gulp.watch('./src/scss/**/*.scss', ['sass']);
        gulp.watch('./src/*.html', browserSync.reload);
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

gulp.task('build', ['vendor', 'sass']);

gulp.task(
    'publish',
    function (done) {
        runSequence(
            'build',
            'useref',
            done
        );
    }
);

gulp.task(
    'default',
    function (done) {
        runSequence(
            [
                'generate-favicon',
                'publish'
            ],
            'inject-favicon-markups',
            done
        );
    }
);
