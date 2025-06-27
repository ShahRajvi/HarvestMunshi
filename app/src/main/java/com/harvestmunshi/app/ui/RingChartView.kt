package com.harvestmunshi.app.ui

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import androidx.core.content.ContextCompat
import com.harvestmunshi.app.R

class RingChartView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyle: Int = 0
) : View(context, attrs, defStyle) {
    private var value: Int = 0
    private var animatedValue: Float = 0f
    private var maxValue: Int = 200 // You can adjust this as needed
    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 24f
        color = ContextCompat.getColor(context, R.color.accent_primary)
        strokeCap = Paint.Cap.ROUND
    }
    private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 24f
        color = ContextCompat.getColor(context, R.color.bg_panel)
    }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.text_primary)
        textAlign = Paint.Align.CENTER
        textSize = 80f
        isFakeBoldText = true
    }
    private val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.text_secondary)
        textAlign = Paint.Align.CENTER
        textSize = 32f
    }
    private val oval = RectF()

    fun setValue(newValue: Int) {
        val animator = ValueAnimator.ofFloat(animatedValue, newValue.toFloat())
        animator.duration = 800
        animator.addUpdateListener {
            animatedValue = it.animatedValue as Float
            invalidate()
        }
        animator.start()
        value = newValue
    }

    fun setMaxValue(newMax: Int) {
        maxValue = newMax
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val padding = 32f
        val size = Math.min(width, height) - padding * 2
        oval.set(padding, padding, padding + size, padding + size)
        // Draw background ring
        canvas.drawArc(oval, 0f, 360f, false, bgPaint)
        // Draw animated ring
        val sweepAngle = (animatedValue / maxValue) * 360f
        canvas.drawArc(oval, -90f, sweepAngle, false, ringPaint)
        // Draw value text
        val centerX = width / 2f
        val centerY = height / 2f - 20f
        canvas.drawText(animatedValue.toInt().toString(), centerX, centerY, textPaint)
        // Draw label
        canvas.drawText("TOTAL HARVESTS", centerX, centerY + 60f, labelPaint)
    }
} 