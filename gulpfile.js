// Require node modules
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync').create(),
    eslint = require('gulp-eslint'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    babel = require('gulp-babel'),
    cleanCSS = require('gulp-clean-css');

// Define source names
var jsSrc = 'src/js/**/*.js',
    jsDist = 'dist/js/**/*.js',
    jsDest = 'dist/js',
    cssDest = 'dist/css',
    sassSrc = 'src/sass/**/*.scss';

// Watch all files when changing live 
gulp.task('serve', ['sass', 'lint'], function () {

    browserSync.init({
        browser: "google chrome",
        server: "./dist"
    });

    gulp.watch(jsDist, ['lint']);
    gulp.watch(sassSrc, ['sass']);
    gulp.watch(jsSrc, ['js-watch']);
    gulp.watch("*.html").on('change', browserSync.reload);
});

gulp.task('serve:dist', function () {  
     browserSync.init({
        browser: "google chrome",
        server: "./dist"
    });
});

// Watch for errors in js files
gulp.task('lint', function () {
    return gulp.src([jsSrc, '!node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

// CSS & SASS
gulp.task('sass', function () {
    gulp.src(sassSrc)
        .pipe(sass({ style: 'expanded' }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(gulp.dest(cssDest))
        .pipe(cleanCSS())
        .pipe(gulp.dest(cssDest))
        .pipe(browserSync.stream());
});

// Concat & minify to production
gulp.task('minify', function () {
    return gulp.src([jsSrc])
        .pipe(concat('scripts.js'))
        .pipe(gulp.dest(jsDest))
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(uglify())
        .pipe(gulp.dest(jsDest));
});

// Concat all files together
gulp.task('library', function () {
    return gulp.src(['src/lib/jquery.min.js', 'src/lib/angular.min.js', 'src/lib/idb.min.js', 'src/lib/moment.min.js', 'src/lib/ui-bootstrap.min.js'])
        .pipe(concat('library.js'))
        .pipe(gulp.dest(jsDest));
});

//Only runs after minify is complete
gulp.task('js-watch', ['minify'], function (done) {
    browserSync.reload();
    done();
});
