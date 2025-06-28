package com.harvestmunshi.app

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.harvestmunshi.app.databinding.ActivityMainBinding
import com.google.android.material.tabs.TabLayoutMediator
import androidx.fragment.app.Fragment
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.harvestmunshi.app.ui.DashboardFragment
import com.harvestmunshi.app.ui.ConfigFragment
import android.widget.ImageView

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Set up cucumber icon in toolbar
        // val cucumberIcon = findViewById<ImageView>(R.id.toolbarCucumberIcon)
        // cucumberIcon?.setImageResource(R.drawable.cucumber_gemini)

        val fragments = listOf(
            DashboardFragment(),
            ConfigFragment()
        )
        val titles = listOf("Dashboard", "Config")

        binding.viewPager.adapter = object : FragmentStateAdapter(this) {
            override fun getItemCount() = fragments.size
            override fun createFragment(position: Int): Fragment = fragments[position]
        }

        TabLayoutMediator(binding.tabLayout, binding.viewPager) { tab, position ->
            tab.text = titles[position]
        }.attach()
    }
} 